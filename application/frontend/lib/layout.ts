import type { TraceNode } from './types';

export const COL = 190;
export const ROW = 124;

// Column per hop, nodes spread evenly and centred within their column
export function layoutByHop(nodes: TraceNode[]) {
  const byHop = new Map<number, TraceNode[]>();
  for (const n of nodes) byHop.set(n.hop, [...(byHop.get(n.hop) ?? []), n]);
  const pos = new Map<string, { x: number; y: number }>();
  for (const [hop, list] of byHop) {
    list.forEach((n, i) => pos.set(n.id, { x: hop * COL, y: (i - (list.length - 1) / 2) * ROW }));
  }
  return pos;
}
