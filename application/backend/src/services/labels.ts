import type { EntityType } from '../types';
import { fetchJson } from './http';
import { isContract } from './rpc';
import type { Chain, ChainId } from './chains';

/**
 * Who is behind an address. Seed lists of well-known entities, then Blockscout's public
 * name tags (where a chain has them), then an on-chain contract check.
 * Every seed address was checked against its public Etherscan label on 2026-10-28.
 */

type Seed = Record<string, { label: string; type: EntityType }>;

// Exchange hot wallets are EOAs: one private key gives the same address on every EVM chain,
// so these apply on all chains - but only while the address is still an EOA there (checked in classify).
const EXCHANGE_EOAS: Seed = {
  '0x28c6c06298d514db089934071355e5743bf21d60': { label: 'Binance 14', type: 'exchange' },
  '0x21a31ee1afc51d94c2efccaa2092ad1028285549': { label: 'Binance 15', type: 'exchange' },
  '0xdfd5293d8e347dfe59e90efd55b2956a1343963d': { label: 'Binance 16', type: 'exchange' },
  '0xf977814e90da44bfa03b6295a0616a897441acec': { label: 'Binance Hot Wallet 20', type: 'exchange' },
  '0x71660c4005ba85c37ccec55d0c4493e66fe775d3': { label: 'Coinbase 1', type: 'exchange' },
  '0xa9d1e08c7793af67e9d92fe308d5697fb81d3e43': { label: 'Coinbase 10', type: 'exchange' },
  '0x267be1c1d684f78cb4f6a176c4911b741e4ffdc0': { label: 'Kraken 4', type: 'exchange' },
  '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b': { label: 'OKX', type: 'exchange' },
  '0xf89d7b9c864f589bbf53a82105107622b35eaa40': { label: 'Bybit Hot Wallet', type: 'exchange' },
  '0x6262998ced04146fa42253a5c0af90ca02dfd2a3': { label: 'Crypto.com 1', type: 'exchange' },
};

// Contracts differ per chain - the same address can be something else (or nothing) elsewhere
const OP_STACK: Seed = {
  '0x4200000000000000000000000000000000000010': { label: 'L2 Standard Bridge', type: 'bridge' },
  '0x4200000000000000000000000000000000000016': { label: 'L2 to L1 Message Passer', type: 'bridge' },
};
const ARBITRUM_ORBIT: Seed = {
  '0x0000000000000000000000000000000000000064': { label: 'ArbSys (withdrawals to L1)', type: 'bridge' },
};
const CONTRACTS: Partial<Record<ChainId, Seed>> = {
  ethereum: {
    // Tornado Cash ETH pools and router (OFAC-listed 2022)
    '0x12d66f87a04a9e220743712ce6d9bb1b5616b8fc': { label: 'Tornado Cash 0.1 ETH', type: 'mixer' },
    '0x47ce0c6ed5b0ce3d3a51fdb1c52dc66a7c3c2936': { label: 'Tornado Cash 1 ETH', type: 'mixer' },
    '0x910cbd523d972eb0a6f4cae4618ad62622b39dbf': { label: 'Tornado Cash 10 ETH', type: 'mixer' },
    '0xa160cdab225685da1d56aa342ad8841c3b53f291': { label: 'Tornado Cash 100 ETH', type: 'mixer' },
    '0xd90e2f925da726b50c4ed8d0fb90ad053324f31': { label: 'Tornado Cash Router', type: 'mixer' },
    // canonical L2 bridges on the Ethereum side
    '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': { label: 'Optimism Gateway', type: 'bridge' },
    '0x3154cf16ccdb4c6d922629664174b904d80f2c35': { label: 'Base Bridge', type: 'bridge' },
    '0xa3a7b6f88361f48403514059f1f16c8e78d60eec': { label: 'Arbitrum ERC20 Gateway', type: 'bridge' },
    '0xcee284f754e854890e311e3280b767f80797180d': { label: 'Arbitrum Custom Gateway', type: 'bridge' },
    '0xd92023e9d9911199a6711321d1277285e6d4e2db': { label: 'Arbitrum WETH Gateway', type: 'bridge' },
    '0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f': { label: 'Arbitrum Delayed Inbox', type: 'bridge' },
    '0x8484ef722627bf18ca5ae6bcf031c23e6e922b30': { label: 'Polygon Ether Bridge', type: 'bridge' },
    '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf': { label: 'Polygon ERC20 Bridge', type: 'bridge' },
  },
  base: OP_STACK,
  optimism: OP_STACK,
  arbitrum: ARBITRUM_ORBIT,
  robinhood: ARBITRUM_ORBIT,
};

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
  const contract = CONTRACTS[chain.id]?.[a];
  if (contract) return Promise.resolve(contract);
  const key = `${chain.id}:${a}`;
  if (!memo.has(key)) {
    memo.set(key, (async () => {
      const eoa = EXCHANGE_EOAS[a];
      if (eoa) {
        // same key, same owner - unless something else was deployed at this address on this chain
        if (!(await isContract(chain, a).catch(() => false))) return eoa;
      }
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
