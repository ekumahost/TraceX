import type { Risk, TraceEdge, TraceNode, Transfer } from '../types';
import { InputError, NotFoundError } from '../types';
import { limiter } from './http';
import { classify } from './labels';
import { resolveEns, transfersInTx } from './rpc';
import { outgoing } from './sources';
import { analyze } from './heuristics';

/**
 * Follows the money forward from a transaction or wallet, breadth-first.
 * - only transfers made after the funds arrived (money moves forward in time)
 * - each wallet expanded once, so loops can't run forever
 * - the largest few transfers per wallet, dust ignored, hard cap on graph size
 * - stops at exchanges, mixers, bridges and contracts: past them the trail isn't one wallet's
 */

export const MAX_HOPS = 20;
const MAX_NODES = 40;
const CHILDREN = 4;
const STOP = new Set(['exchange', 'mixer', 'bridge', 'contract']);

// rough USD weights, used only to rank transfers of different assets against each other
const WEIGHT: Record<string, number> = { ETH: 2500, WETH: 2500, USDT: 1, USDC: 1, DAI: 1 };
const DUST_USD = 25;
const usd = (t: Transfer) => t.value * (WEIGHT[t.asset] ?? 0);

export interface TraceResult {
  input: string;
  network: string;
  nodes: TraceNode[];
  edges: TraceEdge[];
  risks: Risk[];
  source: string;
  incomplete: string[]; // wallets whose transfers couldn't be loaded
}

export function inputKind(input: string): 'tx' | 'wallet' | 'ens' {
  const s = input.trim();
  if (/^0x[a-fA-F0-9]{64}$/.test(s)) return 'tx';
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return 'wallet';
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i.test(s)) return 'ens';
  throw new InputError('Enter a 0x transaction hash, a 0x wallet address or an ENS name');
}

export async function traceCase(input: string, hops = 5): Promise<TraceResult> {
  const maxHops = Math.max(1, Math.min(MAX_HOPS, Math.floor(hops)));
  const kind = inputKind(input);
  const nodes = new Map<string, TraceNode>();
  const edges: TraceEdge[] = [];
  const edgeIds = new Set<string>();
  const run = limiter(4);
  let source = 'Ethereum RPC';
  const incomplete: string[] = [];

  const addNode = (id: string, hop: number) => {
    if (!nodes.has(id)) nodes.set(id, { id, hop, type: hop === 0 ? 'source' : 'wallet', risk: 0 });
    return nodes.get(id)!;
  };
  const addEdge = (t: Transfer) => {
    const id = `${t.hash}:${t.to}:${t.asset}`;
    if (edgeIds.has(id)) return false;
    edgeIds.add(id);
    const hop = Math.max(nodes.get(t.from)!.hop + 1, nodes.get(t.to)!.hop);
    edges.push({ id, from: t.from, to: t.to, txHash: t.hash, value: t.value, asset: t.asset, timestamp: new Date(t.timestamp * 1000).toISOString(), hop });
    return true;
  };

  type Frontier = { address: string; hop: number; fromBlock?: number };
  let frontier: Frontier[] = [];

  if (kind === 'tx') {
    const moved = (await transfersInTx(input.trim())).filter((t) => usd(t) > 0);
    if (!moved.length) throw new NotFoundError('This transaction moved no ETH, USDT, USDC, DAI or WETH');
    const origin = moved[0].from;
    addNode(origin, 0);
    for (const t of moved) {
      addNode(t.from, t.from === origin ? 0 : 1);
      addNode(t.to, 1);
      addEdge(t);
      frontier.push({ address: t.to, hop: 1, fromBlock: t.blockNumber });
    }
  } else {
    const address = kind === 'ens' ? await resolveEns(input.trim()) : input.trim().toLowerCase();
    addNode(address, 0);
    frontier.push({ address, hop: 0 });
  }

  // breadth-first, one hop level at a time
  const expanded = new Set<string>();
  while (frontier.length && nodes.size < MAX_NODES) {
    const next: Frontier[] = [];
    await Promise.all(frontier.map((f) => run(async () => {
      if (expanded.has(f.address) || f.hop >= maxHops || nodes.size >= MAX_NODES) return;
      expanded.add(f.address);
      const node = nodes.get(f.address)!;
      // look up who it is and what it sent at the same time - both are slow on free APIs
      const [entity, res] = await Promise.all([
        classify(f.address),
        outgoing(f.address, f.fromBlock == null ? { recent: true } : { fromBlock: f.fromBlock }).catch((e: Error) => e),
      ]);
      if (node.type !== 'source') node.type = entity.type;
      node.label ??= entity.label;
      if (f.hop > 0 && STOP.has(entity.type)) return;
      // one wallet failing to load shouldn't sink the case - unless it's where we start
      if (res instanceof Error) {
        if (f.hop === 0) throw res;
        incomplete.push(f.address);
        return;
      }

      source = res.source;
      const picked = res.transfers
        .filter((t) => t.to !== f.address && usd(t) >= DUST_USD)
        .sort((a, b) => usd(b) - usd(a))
        .slice(0, CHILDREN);
      for (const t of picked) {
        if (nodes.size >= MAX_NODES && !nodes.has(t.to)) break;
        const isNew = !nodes.has(t.to);
        addNode(t.to, f.hop + 1);
        if (addEdge(t) && isNew) next.push({ address: t.to, hop: f.hop + 1, fromBlock: t.blockNumber });
      }
    })));
    frontier = next;
  }

  // label the leaves too - an exchange at the edge of the graph is the most important node
  await Promise.all([...nodes.values()].filter((n) => !expanded.has(n.id)).map((n) => run(async () => {
    const entity = await classify(n.id);
    if (n.type !== 'source') n.type = entity.type;
    n.label ??= entity.label;
  })));
  const origin = [...nodes.values()].find((n) => n.hop === 0);
  if (origin && !origin.label) origin.label = kind === 'ens' ? input.trim() : kind === 'tx' ? 'Sender' : 'Start wallet';

  const list = [...nodes.values()];
  const risks = analyze(list, edges);
  return { input: input.trim(), network: 'Ethereum', nodes: list, edges, risks, source, incomplete };
}
