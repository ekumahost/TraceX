export type EntityType = 'source' | 'wallet' | 'exchange' | 'mixer' | 'bridge' | 'contract';

export type Severity = 'high' | 'medium' | 'low';

export interface TraceNode {
  id: string; // address
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
  value: number; // in `asset` units
  asset: string;
  timestamp: string; // ISO
  hop: number;
}

export interface Risk {
  type: string; // mixer | peel_chain | velocity | bridge | exchange_hop ...
  severity: Severity;
  title?: string;
  detail?: string;
  tx?: string;
  address?: string;
  count?: number;
}

export interface TraceCase {
  input: string;
  network: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
  risks: Risk[];
  sample?: boolean; // synthetic data, not a live trace
  chain?: string; // backend chain id, e.g. 'base'
  explorer?: string; // block explorer base URL for this chain
  source?: string; // data provider for live traces
  score?: number; // case score from the analysis engine
  engine?: string; // which detector engine ran
  incomplete?: string[]; // wallets whose transfers couldn't be loaded
  hops?: number; // requested maximum trace depth
}

export type Provider = 'meta' | 'fireworks' | 'baseten';

export interface AIAnswer {
  provider: Provider;
  text: string;
}

export type PoisonKind = 'lookalike' | 'fake_token' | 'zero_transfer';

export interface PoisonFinding {
  kind: PoisonKind;
  imposter: string;
  mimics?: string;
  tx: string;
  value: number;
  asset: string;
  timestamp: string;
  detail: string;
}

export interface ShieldResult {
  address: string;
  chain: string;
  explorer: string;
  source: 'Alchemy';
  counterparties: number;
  scanned: number;
  scanLimitPerDirection: number;
  truncated: boolean;
  findingCount: number;
  findingsTruncated: boolean;
  findings: PoisonFinding[];
  imposters: string[];
}

export type RecoveryLanguage = 'english' | 'pidgin' | 'igbo' | 'yoruba' | 'hausa';

export interface RecoveryDocuments {
  provider: 'meta';
  freezeRequest: string;
  policeReport: string;
}
