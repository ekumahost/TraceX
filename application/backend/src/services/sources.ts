import { formatUnits } from 'ethers';
import type { Transfer } from '../types';
import { fetchJson } from './http';
import type { Chain } from './chains';

/**
 * Where outgoing transfers come from, per chain. Alchemy and Etherscan V2 (one key each covers
 * every supported chain) when configured, then the chain's free keyless explorers if it has any.
 */

export interface OutgoingQuery {
  fromBlock?: number; // only transfers at or after this block (following money forward in time)
  recent?: boolean; // newest first - used for the starting wallet
}

interface Source {
  name: string;
  outgoing(address: string, q: OutgoingQuery): Promise<Transfer[]>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PAGE = 100;

// Etherscan's account API, also served keyless by Blockscout
function etherscanCompatible(name: string, base: string, extra: string, chain: Chain): Source {
  async function call(action: 'txlist' | 'tokentx', address: string, q: OutgoingQuery) {
    const url = `${base}?${extra}module=account&action=${action}&address=${address}&startblock=${q.fromBlock ?? 0}&endblock=99999999&page=1&offset=${PAGE}&sort=${q.recent ? 'desc' : 'asc'}`;
    for (let attempt = 0; attempt < 4; attempt++) {
      const d = await fetchJson<any>(url, { cache: false });
      if (Array.isArray(d.result)) return d.result as any[];
      const msg = String(d.result ?? d.message ?? '');
      if (/no (transactions|token transfers) found/i.test(d.message ?? '') || /no (transactions|token transfers) found/i.test(msg)) return [];
      if (/rate limit|too many requests|try again|something went wrong/i.test(msg + (d.message ?? ''))) { await sleep(1500 * (attempt + 1)); continue; }
      throw new Error(`${name}: ${msg || 'unexpected response'}`);
    }
    throw new Error(`${name} is rate limiting requests`);
  }

  return {
    name,
    async outgoing(address, q) {
      const a = address.toLowerCase();
      const [txs, tokens] = await Promise.all([call('txlist', a, q), call('tokentx', a, q)]);
      const native: Transfer[] = txs
        .filter((t) => t.from?.toLowerCase() === a && t.to && t.isError === '0' && t.value !== '0')
        .map((t) => ({
          hash: t.hash, from: a, to: t.to.toLowerCase(), value: Number(formatUnits(t.value, 18)), asset: chain.native,
          timestamp: +t.timeStamp, blockNumber: +t.blockNumber,
        }));
      const erc20: Transfer[] = tokens
        .filter((t) => t.from?.toLowerCase() === a && t.to && chain.tokens[t.contractAddress?.toLowerCase()])
        .map((t) => {
          const token = chain.tokens[t.contractAddress.toLowerCase()];
          return {
            hash: t.hash, from: a, to: t.to.toLowerCase(), value: Number(formatUnits(t.value, token.decimals)), asset: token.symbol,
            timestamp: +t.timeStamp, blockNumber: +t.blockNumber,
          };
        });
      return [...native, ...erc20];
    },
  };
}

// Alchemy's Transfers API. Includes internal transfers (ETH sent by contracts and smart wallets)
// on the chains that support them - drainers and multisigs move funds that way.
async function alchemyPage(key: string, chain: Chain, params: Record<string, unknown>): Promise<{ transfers: Transfer[]; pageKey?: string }> {
  const native = chain.internal ? ['external', 'internal'] : ['external'];
  const d = await fetchJson<any>(`https://${chain.alchemy}.g.alchemy.com/v2/${key}`, {
    method: 'POST',
    cache: false,
    body: {
      jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
      params: [{ toBlock: 'latest', category: [...native, 'erc20'], withMetadata: true, excludeZeroValue: true, ...params }],
    },
  });
  if (d.error) throw new Error(`Alchemy: ${d.error.message}`);
  const transfers = (d.result?.transfers ?? [])
    .filter((t: any) => t.to && t.value != null && (t.category !== 'erc20' || chain.tokens[t.rawContract?.address?.toLowerCase()]))
    .map((t: any): Transfer => ({
      hash: t.hash, from: t.from.toLowerCase(), to: t.to.toLowerCase(), value: Number(t.value),
      asset: t.category === 'erc20' ? chain.tokens[t.rawContract.address.toLowerCase()].symbol : chain.native,
      timestamp: Math.floor(Date.parse(t.metadata.blockTimestamp) / 1000), blockNumber: parseInt(t.blockNum, 16),
    }));
  return { transfers, pageKey: d.result?.pageKey };
}

const alchemyTransfers = async (key: string, chain: Chain, params: Record<string, unknown>) =>
  (await alchemyPage(key, chain, params)).transfers;

function alchemy(key: string, chain: Chain): Source {
  return {
    name: 'Alchemy',
    outgoing: (address, q) => alchemyTransfers(key, chain, {
      fromBlock: '0x' + (q.fromBlock ?? 0).toString(16), fromAddress: address.toLowerCase(),
      maxCount: '0x' + PAGE.toString(16), order: q.recent ? 'desc' : 'asc',
    }),
  };
}

// Every transfer inside one transaction, internal ones included. Null when Alchemy isn't configured.
export async function transfersInTxViaAlchemy(chain: Chain, hash: string, blockNumber: number): Promise<Transfer[] | null> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key || !chain.alchemy) return null;
  const block = '0x' + blockNumber.toString(16);
  const mine = (ts: Transfer[]) => ts.filter((t) => t.hash.toLowerCase() === hash.toLowerCase());
  // a busy block has thousands of transfers - page through a few
  let found: Transfer[] = [];
  let pageKey: string | undefined;
  for (let page = 0; page < 5; page++) {
    const res = await alchemyPage(key, chain, { fromBlock: block, toBlock: block, maxCount: '0x3e8', ...(pageKey ? { pageKey } : {}) });
    found = found.concat(mine(res.transfers));
    pageKey = res.pageKey;
    if (!pageKey) break;
  }
  return found;
}

export function sources(chain: Chain): Source[] {
  const list: Source[] = [];
  if (process.env.ALCHEMY_API_KEY && chain.alchemy) list.push(alchemy(process.env.ALCHEMY_API_KEY, chain));
  if (process.env.ETHERSCAN_API_KEY) {
    list.push(etherscanCompatible('Etherscan', 'https://api.etherscan.io/v2/api', `chainid=${chain.chainId}&apikey=${process.env.ETHERSCAN_API_KEY}&`, chain));
  }
  for (const k of chain.keyless) list.push(etherscanCompatible(k.name, k.base, '', chain));
  return list;
}

const memo = new Map<string, { at: number; data: Transfer[] }>();

// First source that answers wins; falls through to the next on failure
export async function outgoing(chain: Chain, address: string, q: OutgoingQuery): Promise<{ transfers: Transfer[]; source: string }> {
  const list = sources(chain);
  const hint = `add a free ALCHEMY_API_KEY (or ETHERSCAN_API_KEY) to application/backend/.env to trace ${chain.name}`;
  if (!list.length) throw new Error(`No data source for ${chain.name} - ${hint}`);
  const errors: string[] = [];
  for (const s of list) {
    const key = `${chain.id}|${s.name}|${address}|${q.fromBlock ?? ''}|${q.recent ? 'r' : ''}`;
    const hit = memo.get(key);
    if (hit && Date.now() - hit.at < 10 * 60_000) return { transfers: hit.data, source: s.name };
    try {
      const transfers = await s.outgoing(address, q);
      memo.set(key, { at: Date.now(), data: transfers });
      return { transfers, source: s.name };
    } catch (e: any) {
      errors.push(e.message);
    }
  }
  const keyed = process.env.ALCHEMY_API_KEY || process.env.ETHERSCAN_API_KEY;
  throw new Error(`Couldn't fetch ${chain.name} transfers - ${errors.join('; ')}${keyed ? '' : ` (${hint})`}`);
}

// Raw Alchemy transfers with no asset filtering - the Poisoning Shield needs to see the
// spam: fake tokens and zero-value transfers are exactly what it's looking for.
export interface RawTransfer {
  hash: string; from: string; to: string; value: number; asset: string; category: string;
  contract?: string; timestamp: number;
}

export interface RawTransfersResult {
  transfers: RawTransfer[];
  truncated: boolean;
}

const RAW_TRANSFER_PAGE_SIZE = 1000;

export async function rawTransfers(chain: Chain, params: Record<string, unknown>, pages = 2): Promise<RawTransfersResult> {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key || !chain.alchemy) throw new Error(`The Poisoning Shield needs ALCHEMY_API_KEY with ${chain.name} enabled`);
  const out: RawTransfer[] = [];
  let pageKey: string | undefined;
  for (let page = 0; page < pages; page++) {
    const d = await fetchJson<any>(`https://${chain.alchemy}.g.alchemy.com/v2/${key}`, {
      method: 'POST',
      cache: false,
      body: {
        jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: '0x0', toBlock: 'latest', category: ['external', 'erc20'], withMetadata: true,
          excludeZeroValue: false, maxCount: `0x${RAW_TRANSFER_PAGE_SIZE.toString(16)}`, order: 'desc', ...params, ...(pageKey ? { pageKey } : {}),
        }],
      },
    });
    if (d.error) throw new Error(`Alchemy: ${d.error.message}`);
    for (const t of d.result?.transfers ?? []) {
      if (!t.from || !t.to) continue;
      out.push({
        hash: t.hash, from: t.from.toLowerCase(), to: t.to.toLowerCase(), value: Number(t.value ?? 0),
        asset: t.asset ?? '?', category: t.category, contract: t.rawContract?.address?.toLowerCase(),
        timestamp: Math.floor(Date.parse(t.metadata.blockTimestamp) / 1000),
      });
    }
    pageKey = d.result?.pageKey;
    if (!pageKey) break;
  }
  return { transfers: out, truncated: Boolean(pageKey) };
}
