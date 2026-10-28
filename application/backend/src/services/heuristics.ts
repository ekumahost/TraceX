import type { Risk, TraceEdge, TraceNode } from '../types';

/**
 * Deterministic detectors over the traced graph. They only report what the edges show,
 * each with the tx hash that proves it - the AI layer explains these, it never invents them.
 * Mirrors the rules planned for analysis-engine/ (Python on Modal).
 */

const fmt = (v: number, asset: string) =>
  `${v.toLocaleString('en-US', { maximumFractionDigits: v >= 100 ? 0 : 3 })} ${asset}`;

const minutes = (ms: number) => {
  const m = Math.round(ms / 60000);
  return m < 120 ? `${m} minutes` : `${Math.round(m / 60)} hours`;
};

export function analyze(nodes: TraceNode[], edges: TraceEdge[]): Risk[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const name = (id: string) => byId.get(id)?.label ?? `${id.slice(0, 8)}…${id.slice(-4)}`;
  const outs = (id: string) => edges.filter((e) => e.from === id);
  const risks: Risk[] = [];
  const bump = (id: string, risk: number) => {
    const n = byId.get(id);
    if (n && n.type !== 'source') n.risk = Math.max(n.risk, risk);
  };

  // base risk by entity type
  for (const n of nodes) n.risk = { source: 0, wallet: 10, contract: 10, exchange: 40, bridge: 45, mixer: 95 }[n.type];

  // mixers: deposits in, and wallets funded out of them
  for (const e of edges) {
    const to = byId.get(e.to), from = byId.get(e.from);
    if (to?.type === 'mixer') {
      bump(e.from, 85);
      risks.push({ type: 'mixer', severity: 'high', tx: e.txHash, address: e.to, detail: `${fmt(e.value, e.asset)} sent from ${name(e.from)} into ${name(e.to)}.` });
    }
    if (from?.type === 'mixer') {
      bump(e.to, 75);
      risks.push({ type: 'mixer', severity: 'high', tx: e.txHash, address: e.to, detail: `${name(e.to)} received ${fmt(e.value, e.asset)} withdrawn from ${name(e.from)}.` });
    }
  }

  // peel chain: a wallet passes most of its balance on and shaves a little off, repeatedly.
  // A step needs one dominant outflow (>= 60%) and at least one small shave (<= 10%).
  const peelNext = (id: string) => {
    const o = outs(id);
    if (o.length < 2 || new Set(o.map((e) => e.asset)).size > 1) return null;
    const total = o.reduce((s, e) => s + e.value, 0);
    const big = o.reduce((a, b) => (b.value > a.value ? b : a));
    const shaved = o.some((e) => e !== big && e.value / total <= 0.1);
    return big.value / total >= 0.6 && shaved ? big : null;
  };
  const inChain = new Set<string>();
  for (const n of nodes) {
    if (inChain.has(n.id)) continue;
    const chain: TraceEdge[] = [];
    let cur: string | undefined = n.id;
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
      seen.add(cur);
      const next = peelNext(cur);
      if (!next) break;
      chain.push(next);
      cur = next.to;
    }
    if (chain.length >= 3) {
      chain.forEach((e) => { inChain.add(e.from); bump(e.from, 60); });
      const shaved = chain.map((e) => Math.min(...outs(e.from).filter((x) => x !== e).map((x) => x.value)));
      risks.push({
        type: 'peel_chain', severity: 'medium', address: n.id, count: chain.length, tx: chain[0].txHash,
        detail: `${chain.length} wallets in a row from ${name(n.id)} each pass most of the balance on while shaving ${fmt(Math.min(...shaved), chain[0].asset)}–${fmt(Math.max(...shaved), chain[0].asset)} off.`,
      });
    }
  }

  // velocity: many hops crossed within the first hour
  if (edges.length) {
    const t0 = Math.min(...edges.map((e) => Date.parse(e.timestamp)));
    const fast = edges.filter((e) => Date.parse(e.timestamp) - t0 <= 60 * 60_000);
    const deepest = fast.reduce((a, b) => (b.hop > a.hop ? b : a), fast[0]);
    if (deepest && deepest.hop >= 3) {
      const first = edges.find((e) => Date.parse(e.timestamp) === t0)!;
      risks.push({
        type: 'velocity', severity: 'medium', tx: first.txHash,
        detail: `Funds crossed ${deepest.hop} hops in ${minutes(Date.parse(deepest.timestamp) - t0)} - far faster than normal wallet activity.`,
      });
    }
  }

  // exits: exchange deposits (KYC may identify the owner) and bridges (trail continues elsewhere)
  for (const e of edges) {
    const to = byId.get(e.to);
    if (to?.type === 'exchange' && e.hop > 1) {
      risks.push({ type: 'exchange_hop', severity: 'medium', tx: e.txHash, address: e.to, detail: `${fmt(e.value, e.asset)} reached ${name(e.to)} - an exchange where KYC records may identify the owner.` });
    }
    if (to?.type === 'bridge') {
      risks.push({ type: 'bridge', severity: 'low', tx: e.txHash, address: e.to, detail: `${fmt(e.value, e.asset)} sent into ${name(e.to)}; the trail continues on another chain.` });
    }
  }

  // exchange hopping: the same funds pass through more than one exchange along a path
  const exchanges = nodes.filter((n) => n.type === 'exchange').map((n) => n.id);
  const firstStep = (a: string, b: string): TraceEdge | null => {
    // breadth-first from a; returns the first edge of a shortest path to b
    const prev = new Map<string, TraceEdge>();
    const queue = [a];
    const seen = new Set([a]);
    while (queue.length) {
      const cur = queue.shift()!;
      for (const e of outs(cur)) {
        if (seen.has(e.to)) continue;
        seen.add(e.to);
        prev.set(e.to, e);
        if (e.to === b) {
          let step = e;
          while (step.from !== a) step = prev.get(step.from)!;
          return step;
        }
        queue.push(e.to);
      }
    }
    return null;
  };
  for (const a of exchanges) {
    for (const b of exchanges) {
      const step = a !== b ? firstStep(a, b) : null;
      if (step) risks.push({ type: 'exchange_hop', severity: 'medium', tx: step.txHash, address: a, detail: `Funds moved from ${name(a)} on to ${name(b)} - hopping between exchanges to break the trail.` });
    }
  }

  // one flag per pattern and address - repeat deposits to the same exchange are one finding
  const seen = new Set<string>();
  const unique = risks.filter((r) => {
    const key = `${r.type}|${r.address ?? r.tx}`;
    return !seen.has(key) && !!seen.add(key);
  });
  const rank = { high: 0, medium: 1, low: 2 };
  return unique.sort((a, b) => rank[a.severity] - rank[b.severity]).slice(0, 12);
}
