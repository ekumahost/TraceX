// Shared trace shapes - mirror application/frontend/lib/types.ts

export type EntityType = 'source' | 'wallet' | 'exchange' | 'mixer' | 'bridge' | 'contract';
export type Severity = 'high' | 'medium' | 'low';

export interface TraceNode {
  id: string; // chain-qualified identity
  address?: string; // lowercase EVM address
  chain?: string;
  label?: string;
  type: EntityType;
  hop: number;
  risk: number; // 0-100
}

export interface TraceEdge {
  id: string;
  from: string;
  to: string;
  txHash: string;
  value: number;
  asset: string;
  timestamp: string; // ISO
  hop: number;
  chain?: string;
  destinationTxHash?: string;
  destinationChain?: string;
}

export interface Risk {
  type: 'mixer' | 'peel_chain' | 'velocity' | 'exchange_hop' | 'bridge';
  severity: Severity;
  detail: string;
  tx?: string;
  address?: string;
  count?: number;
}

// One value movement out of an address, as returned by a data source
export interface Transfer {
  hash: string;
  from: string;
  to: string;
  value: number;
  asset: string;
  timestamp: number; // unix seconds
  blockNumber: number;
}

export class InputError extends Error {}
export class NotFoundError extends Error {}
