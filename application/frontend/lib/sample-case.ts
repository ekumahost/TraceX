import type { Risk, TraceCase, TraceEdge, TraceNode } from './types';

/**
 * Synthetic sample case - a wallet drain laundered through a mixer, a peel chain,
 * a bridge and an exchange. Every address and tx hash here is generated, not real.
 * Used when the live fetcher isn't connected, and always labelled as a sample in the UI.
 */

// deterministic pseudo-random hex so the sample looks the same on every load
function hex(seed: string, len: number) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  let out = '';
  while (out.length < len) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    out += (h >>> 0).toString(16).padStart(8, '0');
  }
  return '0x' + out.slice(0, len);
}

const addr = (s: string) => hex('addr:' + s, 40);
const tx = (s: string) => hex('tx:' + s, 64);

const N = (key: string, type: TraceNode['type'], hop: number, risk: number, label?: string): TraceNode => ({
  id: addr(key), type, hop, risk, label,
});

const nodes: TraceNode[] = [
  N('origin', 'source', 0, 0, 'Origin wallet'),
  N('drainer', 'wallet', 1, 82, 'Drainer'),
  N('mixer', 'mixer', 2, 96, 'Mixing pool'),
  N('peel1', 'wallet', 2, 64, 'Peel 1'),
  N('fresh', 'wallet', 3, 71, 'Fresh wallet'),
  N('side1', 'wallet', 3, 30),
  N('peel2', 'wallet', 3, 58, 'Peel 2'),
  N('side2', 'wallet', 4, 25),
  N('bridge', 'bridge', 4, 45, 'Bridge'),
  N('peel3', 'wallet', 4, 52, 'Peel 3'),
  N('side3', 'wallet', 5, 20),
  N('cex', 'exchange', 5, 40, 'Exchange deposit'),
];

const t0 = Date.UTC(2026, 9, 14, 2, 11);
const E = (key: string, from: string, to: string, value: number, minutes: number, hop: number): TraceEdge => ({
  id: key, from: addr(from), to: addr(to), txHash: tx(key), value, asset: 'ETH',
  timestamp: new Date(t0 + minutes * 60000).toISOString(), hop,
});

const edges: TraceEdge[] = [
  E('drain', 'origin', 'drainer', 120, 0, 1),
  E('mix-in', 'drainer', 'mixer', 40, 6, 2),
  E('peel1', 'drainer', 'peel1', 79.5, 9, 2),
  E('side1', 'peel1', 'side1', 4.2, 14, 3),
  E('peel2', 'peel1', 'peel2', 75.2, 15, 3),
  E('side2', 'peel2', 'side2', 3.8, 21, 4),
  E('bridge', 'peel2', 'bridge', 20, 23, 4),
  E('peel3', 'peel2', 'peel3', 51.3, 24, 4),
  E('side3', 'peel3', 'side3', 2.9, 31, 5),
  E('cashout', 'peel3', 'cex', 48.3, 38, 5),
  E('mix-out', 'mixer', 'fresh', 39.6, 312, 3),
];

const risks: Risk[] = [
  {
    type: 'mixer', severity: 'high', tx: tx('mix-in'), address: addr('mixer'),
    detail: '40 ETH deposited into a mixing pool 6 minutes after the drain. 39.6 ETH left the pool 5 hours later to a never-used wallet.',
  },
  {
    type: 'peel_chain', severity: 'medium', address: addr('peel1'), count: 3, tx: tx('peel2'),
    detail: 'Funds pass Peel 1 → Peel 2 → Peel 3, shaving 2.9–4.2 ETH off to side wallets at each hop.',
  },
  {
    type: 'velocity', severity: 'medium', tx: tx('drain'),
    detail: '120 ETH moved across 5 hops in 38 minutes - far faster than normal wallet behaviour.',
  },
  {
    type: 'exchange_hop', severity: 'medium', tx: tx('cashout'), address: addr('cex'),
    detail: '48.3 ETH reached an exchange deposit address - a cash-out point where KYC records may exist.',
  },
  {
    type: 'bridge', severity: 'low', tx: tx('bridge'), address: addr('bridge'),
    detail: '20 ETH sent into a cross-chain bridge; the trail continues on another network.',
  },
];

export const SAMPLE_CASE: TraceCase = {
  input: tx('drain'),
  network: 'Ethereum',
  nodes,
  edges,
  risks,
  sample: true,
};
