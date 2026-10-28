// Chains the backend can trace - keep in step with backend/src/services/chains.ts
export const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', explorer: 'https://etherscan.io' },
  { id: 'base', name: 'Base', explorer: 'https://basescan.org' },
  { id: 'bnb', name: 'BNB Chain', explorer: 'https://bscscan.com' },
  { id: 'arbitrum', name: 'Arbitrum', explorer: 'https://arbiscan.io' },
  { id: 'optimism', name: 'Optimism', explorer: 'https://optimistic.etherscan.io' },
  { id: 'polygon', name: 'Polygon', explorer: 'https://polygonscan.com' },
  { id: 'robinhood', name: 'Robinhood Chain', explorer: 'https://robinhoodchain.blockscout.com' },
] as const;

export type ChainId = (typeof CHAINS)[number]['id'];
export const chainName = (id?: string) => CHAINS.find((c) => c.id === id)?.name;
