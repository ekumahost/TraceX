import type { Risk, Severity, TraceCase, TraceNode } from './types';

export const short = (hash: string, head = 6, tail = 4) =>
  hash.length <= head + tail + 2 ? hash : `${hash.slice(0, head)}…${hash.slice(-tail)}`;

export const fmtValue = (v: number, asset = 'ETH') =>
  `${v >= 100 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : v.toLocaleString('en-US', { maximumFractionDigits: 3 })} ${asset}`;

export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';

export function fmtDuration(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.round(h / 24)} days`;
}

// Case score - same rule as the detectors: the worst finding sets the floor, each further one adds a little
const FLOOR: Record<Severity, number> = { high: 70, medium: 40, low: 15 };
const EXTRA: Record<Severity, number> = { high: 15, medium: 8, low: 3 };
const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
export function caseScore(risks: Risk[]) {
  if (!risks.length) return 0;
  const [worst, ...rest] = [...risks].sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  return Math.min(100, FLOOR[worst.severity] + rest.reduce((s, r) => s + EXTRA[r.severity], 0));
}

export function verdict(score: number): { label: string; tone: Severity | 'clean' } {
  if (score >= 60) return { label: 'High risk', tone: 'high' };
  if (score >= 30) return { label: 'Elevated', tone: 'medium' };
  if (score > 0) return { label: 'Low risk', tone: 'low' };
  return { label: 'No flags', tone: 'clean' };
}

export const riskTone = (risk: number): Severity | 'clean' =>
  risk >= 70 ? 'high' : risk >= 40 ? 'medium' : risk > 0 ? 'low' : 'clean';

export const TYPE_LABEL: Record<TraceNode['type'], string> = {
  source: 'Origin',
  wallet: 'Wallet',
  exchange: 'Exchange',
  mixer: 'Mixer',
  bridge: 'Bridge',
  contract: 'Contract',
};

export const RISK_TITLE: Record<string, string> = {
  mixer: 'Mixer interaction',
  peel_chain: 'Peel chain',
  velocity: 'High-velocity movement',
  bridge: 'Cross-chain bridge',
  exchange_hop: 'Exchange hopping',
};

export function caseStats(c: TraceCase) {
  const times = c.edges.map((e) => +new Date(e.timestamp)).filter(Boolean);
  const origin = c.nodes.find((n) => n.type === 'source')?.id ?? c.nodes[0]?.id;
  const outOfOrigin = c.edges.filter((e) => e.from === origin).reduce((s, e) => s + e.value, 0);
  return {
    wallets: c.nodes.length,
    transfers: c.edges.length,
    hops: Math.max(0, ...c.nodes.map((n) => n.hop)),
    moved: outOfOrigin,
    asset: c.edges[0]?.asset ?? 'ETH',
    span: times.length > 1 ? Math.max(...times) - Math.min(...times) : 0,
  };
}

export const TX_RE = /0x[a-fA-F0-9]{64}/g;
export const ADDR_RE = /0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g;
