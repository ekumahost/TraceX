// Chains the backend can trace - keep in step with backend/src/services/chains.ts
export const CHAINS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'base', name: 'Base' },
  { id: 'bnb', name: 'BNB Chain' },
  { id: 'arbitrum', name: 'Arbitrum' },
  { id: 'optimism', name: 'Optimism' },
  { id: 'polygon', name: 'Polygon' },
] as const;

export type ChainId = (typeof CHAINS)[number]['id'];
export const chainName = (id?: string) => CHAINS.find((c) => c.id === id)?.name;
