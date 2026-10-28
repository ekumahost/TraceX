import type { EntityType } from '../types';
import { fetchJson } from './http';
import { isContract } from './rpc';
import type { Chain, ChainId } from './chains';

/**
 * Who is behind an address. A small seed list of well-known entities, then Blockscout's
 * public name tags, then an on-chain contract check. Extend KNOWN as investigations grow.
 */

// Seed labels are per chain - the same address can belong to someone else on another chain
const KNOWN: Partial<Record<ChainId, Record<string, { label: string; type: EntityType }>>> = { ethereum: {
  // Tornado Cash ETH pools and router (OFAC-listed 2022)
  '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc': { label: 'Tornado Cash 0.1 ETH', type: 'mixer' },
  '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 1 ETH', type: 'mixer' },
  '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 10 ETH', type: 'mixer' },
  '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 100 ETH', type: 'mixer' },
  '0xd90e2f925da726b50c4ed8d0fb90ad053324f31': { label: 'Tornado Cash Router', type: 'mixer' },
  // exchange hot wallets
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance 14', type: 'exchange' },
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { label: 'Coinbase 10', type: 'exchange' },
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0': { label: 'Kraken 4', type: 'exchange' },
} };

const RULES: [RegExp, EntityType][] = [
  [/tornado|mixer|railgun|sinbad|blender|cyclone/i, 'mixer'],
  [/bridge|gateway|portal|wormhole|stargate|hop protocol|across|layerzero|synapse|multichain|orbiter/i, 'bridge'],
  [/binance|coinbase|kraken|okx|okex|bybit|kucoin|bitfinex|gemini|huobi|htx|gate\.io|bitstamp|crypto\.com|mexc|bitget|upbit|exchange|hot wallet|deposit/i, 'exchange'],
];

export interface Entity { type: EntityType; label?: string }
const memo = new Map<string, Promise<Entity>>();

async function blockscoutInfo(chain: Chain, address: string): Promise<{ isContract?: boolean; names: string[] } | null> {
  if (!chain.labels) return null;
  try {
    const d = await fetchJson<any>(`${chain.labels}/addresses/${address}`, { timeoutMs: 5000, retries: 0 });
    const names = [
      d.name,
      d.ens_domain_name,
      ...(d.metadata?.tags ?? []).map((t: any) => t.name),
      ...(d.public_tags ?? []).map((t: any) => t.display_name ?? t.label),
    ].filter((x): x is string => typeof x === 'string' && x.length > 0);
    return { isContract: d.is_contract, names };
  } catch {
    return null; // labels are best-effort
  }
}

export function classify(chain: Chain, address: string): Promise<Entity> {
  const a = address.toLowerCase();
  const known = KNOWN[chain.id]?.[a];
  if (known) return Promise.resolve(known);
  const key = `${chain.id}:${a}`;
  if (!memo.has(key)) {
    memo.set(key, (async () => {
      const info = await blockscoutInfo(chain, a);
      const names = info?.names ?? [];
      for (const [re, type] of RULES) {
        const hit = names.find((n) => re.test(n));
        if (hit) return { type, label: hit };
      }
      const contract = info?.isContract ?? (await isContract(chain, a).catch(() => false));
      return { type: contract ? 'contract' : 'wallet', label: names[0] };
    })());
  }
  return memo.get(key)!;
}
