import { formatUnits } from 'ethers';
import type { Transfer } from '../types';
import { fetchJson } from './http';
import { TOKENS } from './tokens';

/**
 * Where outgoing transfers come from. Alchemy and Etherscan when their keys are set,
 * then Blockscout, which is free and keyless - so tracing works with no setup at all.
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
function etherscanCompatible(name: string, base: string, extra: string): Source {
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
          hash: t.hash, from: a, to: t.to.toLowerCase(), value: Number(formatUnits(t.value, 18)), asset: 'ETH',
          timestamp: +t.timeStamp, blockNumber: +t.blockNumber,
        }));
      const erc20: Transfer[] = tokens
        .filter((t) => t.from?.toLowerCase() === a && t.to && TOKENS[t.contractAddress?.toLowerCase()])
        .map((t) => {
          const token = TOKENS[t.contractAddress.toLowerCase()];
          return {
            hash: t.hash, from: a, to: t.to.toLowerCase(), value: Number(formatUnits(t.value, token.decimals)), asset: token.symbol,
            timestamp: +t.timeStamp, blockNumber: +t.blockNumber,
          };
        });
      return [...native, ...erc20];
    },
  };
}

function alchemy(key: string): Source {
  const url = `https://eth-mainnet.g.alchemy.com/v2/${key}`;
  return {
    name: 'Alchemy',
    async outgoing(address, q) {
      const a = address.toLowerCase();
      const d = await fetchJson<any>(url, {
        method: 'POST',
        cache: false,
        body: {
          jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: '0x' + (q.fromBlock ?? 0).toString(16), toBlock: 'latest', fromAddress: a,
            category: ['external', 'erc20'], withMetadata: true, excludeZeroValue: true,
            maxCount: '0x' + PAGE.toString(16), order: q.recent ? 'desc' : 'asc',
          }],
        },
      });
      if (d.error) throw new Error(`Alchemy: ${d.error.message}`);
      return (d.result?.transfers ?? [])
        .filter((t: any) => t.to && t.value != null && (t.category === 'external' || TOKENS[t.rawContract?.address?.toLowerCase()]))
        .map((t: any): Transfer => ({
          hash: t.hash, from: a, to: t.to.toLowerCase(), value: Number(t.value),
          asset: t.category === 'external' ? 'ETH' : TOKENS[t.rawContract.address.toLowerCase()].symbol,
          timestamp: Math.floor(Date.parse(t.metadata.blockTimestamp) / 1000), blockNumber: parseInt(t.blockNum, 16),
        }));
    },
  };
}

export function sources(): Source[] {
  const list: Source[] = [];
  if (process.env.ALCHEMY_API_KEY) list.push(alchemy(process.env.ALCHEMY_API_KEY));
  if (process.env.ETHERSCAN_API_KEY) {
    list.push(etherscanCompatible('Etherscan', 'https://api.etherscan.io/v2/api', `chainid=1&apikey=${process.env.ETHERSCAN_API_KEY}&`));
  }
  list.push(etherscanCompatible('Blockscout', 'https://eth.blockscout.com/api', ''));
  return list;
}

const memo = new Map<string, { at: number; data: Transfer[] }>();

// First source that answers wins; falls through to the next on failure
export async function outgoing(address: string, q: OutgoingQuery): Promise<{ transfers: Transfer[]; source: string }> {
  const errors: string[] = [];
  for (const s of sources()) {
    const key = `${s.name}|${address}|${q.fromBlock ?? ''}|${q.recent ? 'r' : ''}`;
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
  throw new Error(`Couldn't fetch transfers - ${errors.join('; ')}`);
}
