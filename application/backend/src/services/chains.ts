import { InputError } from '../types';

/**
 * Supported EVM chains and everything that differs between them: RPC, native coin,
 * tokens worth following, data sources and explorer. Token addresses are checked
 * on-chain (symbol + decimals) by scripts/check-chains.ts.
 */

export type ChainId = 'ethereum' | 'base' | 'bnb' | 'arbitrum' | 'optimism' | 'polygon' | 'robinhood';

export interface Token { symbol: string; decimals: number; usd: number }

export interface Chain {
  id: ChainId;
  name: string;
  chainId: number; // EVM chain id, used by Etherscan V2
  native: string;
  nativeUsd: number; // rough price, only for ranking transfers of different assets
  rpc: string; // free public node, used when no RPC_URL / Alchemy key
  alchemy?: string; // Alchemy network subdomain
  internal?: boolean; // Alchemy reports internal (contract-to-address) ETH transfers on this chain
  keyless: { name: string; base: string }[]; // free Etherscan-compatible APIs
  labels?: string; // Blockscout v2 API for address name tags
  explorer: string;
  tokens: Record<string, Token>; // lowercase address -> token
}

const ETH_USD = 2500, BNB_USD = 600, POL_USD = 0.4;
const stable = (symbol: string, decimals = 6): Token => ({ symbol, decimals, usd: 1 });

// Tokens worth following. Everything else is ignored - airdropped spam tokens would flood the graph.
export const CHAINS: Record<ChainId, Chain> = {
  ethereum: {
    id: 'ethereum', name: 'Ethereum', chainId: 1, native: 'ETH', nativeUsd: ETH_USD,
    rpc: 'https://ethereum-rpc.publicnode.com', alchemy: 'eth-mainnet', internal: true,
    keyless: [
      { name: 'Blockscout', base: 'https://eth.blockscout.com/api' },
      { name: 'Routescan', base: 'https://api.routescan.io/v2/network/mainnet/evm/1/etherscan/api' },
    ],
    labels: 'https://eth.blockscout.com/api/v2',
    explorer: 'https://etherscan.io',
    tokens: {
      '0xdac17f958d2ee523a2206206994597c13d831ec7': stable('USDT'),
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': stable('USDC'),
      '0x6b175474e89094c44da98b954eedeac495271d0f': stable('DAI', 18),
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18, usd: ETH_USD },
    },
  },
  base: {
    id: 'base', name: 'Base', chainId: 8453, native: 'ETH', nativeUsd: ETH_USD,
    rpc: 'https://base-rpc.publicnode.com', alchemy: 'base-mainnet', internal: true,
    keyless: [],
    explorer: 'https://basescan.org',
    tokens: {
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': stable('USDC'),
      '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': stable('USDT'),
      '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': stable('DAI', 18),
      '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18, usd: ETH_USD },
    },
  },
  bnb: {
    id: 'bnb', name: 'BNB Chain', chainId: 56, native: 'BNB', nativeUsd: BNB_USD,
    rpc: 'https://bsc-rpc.publicnode.com', alchemy: 'bnb-mainnet',
    keyless: [],
    explorer: 'https://bscscan.com',
    tokens: {
      '0x55d398326f99059ff775485246999027b3197955': stable('USDT', 18),
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': stable('USDC', 18),
      '0xe9e7cea3dedca5984780bafc599bd69add087d56': stable('BUSD', 18),
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'WBNB', decimals: 18, usd: BNB_USD },
    },
  },
  arbitrum: {
    id: 'arbitrum', name: 'Arbitrum', chainId: 42161, native: 'ETH', nativeUsd: ETH_USD,
    rpc: 'https://arbitrum-one-rpc.publicnode.com', alchemy: 'arb-mainnet',
    keyless: [],
    explorer: 'https://arbiscan.io',
    tokens: {
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': stable('USDC'),
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': stable('USDT'),
      '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': stable('DAI', 18),
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': { symbol: 'WETH', decimals: 18, usd: ETH_USD },
    },
  },
  optimism: {
    id: 'optimism', name: 'Optimism', chainId: 10, native: 'ETH', nativeUsd: ETH_USD,
    rpc: 'https://optimism-rpc.publicnode.com', alchemy: 'opt-mainnet',
    keyless: [{ name: 'Optimism Explorer', base: 'https://explorer.optimism.io/api' }],
    labels: 'https://explorer.optimism.io/api/v2',
    explorer: 'https://optimistic.etherscan.io',
    tokens: {
      '0x0b2c639c533813f4aa9d7837caf62653d097ff85': stable('USDC'),
      '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': stable('USDT'),
      '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': stable('DAI', 18),
      '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18, usd: ETH_USD },
    },
  },
  polygon: {
    id: 'polygon', name: 'Polygon', chainId: 137, native: 'POL', nativeUsd: POL_USD,
    rpc: 'https://polygon-bor-rpc.publicnode.com', alchemy: 'polygon-mainnet', internal: true,
    keyless: [],
    explorer: 'https://polygonscan.com',
    tokens: {
      '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': stable('USDC'),
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': stable('USDC.e'),
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': stable('USDT'),
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': stable('DAI', 18),
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: 'WETH', decimals: 18, usd: ETH_USD },
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': { symbol: 'WPOL', decimals: 18, usd: POL_USD },
    },
  },
  // Arbitrum Orbit L2; tokens picked from its most-transferred contracts (2026-10-28)
  robinhood: {
    id: 'robinhood', name: 'Robinhood Chain', chainId: 4663, native: 'ETH', nativeUsd: ETH_USD,
    rpc: 'https://rpc.mainnet.chain.robinhood.com', alchemy: 'robinhood-mainnet',
    keyless: [],
    explorer: 'https://robinhoodchain.blockscout.com',
    tokens: {
      '0x5fc5360d0400a0fd4f2af552add042d716f1d168': stable('USDG'),
      '0x0bd7d308f8e1639fab988df18a8011f41eacad73': { symbol: 'WETH', decimals: 18, usd: ETH_USD },
    },
  },
};

export const CHAIN_ORDER: ChainId[] = ['ethereum', 'base', 'bnb', 'arbitrum', 'optimism', 'polygon', 'robinhood'];

export function getChain(id?: string): Chain {
  if (!id || id === 'auto') return CHAINS.ethereum;
  const chain = CHAINS[id as ChainId];
  if (!chain) throw new InputError(`Unsupported chain "${id}". Use one of: ${CHAIN_ORDER.join(', ')}`);
  return chain;
}

// Rough USD value of one unit of an asset on a chain - for ranking only
export function usdWeight(chain: Chain, asset: string) {
  if (asset === chain.native) return chain.nativeUsd;
  return Object.values(chain.tokens).find((t) => t.symbol === asset)?.usd ?? 0;
}
