import type { Risk, TraceEdge, TraceNode, Transfer } from '../types';
import { InputError, NotFoundError } from '../types';
import { limiter } from './http';
import { classify } from './labels';
import { findTxChain, resolveEns, transfersInTx } from './rpc';
import { getChain, usdWeight, type Chain } from './chains';
import { outgoing } from './sources';
import { runAnalysis } from './analysis';
import { followCanonicalBridge } from './bridges';

/**
 * Follows the money forward from a transaction or wallet, breadth-first.
 * - only transfers made after the funds arrived (money moves forward in time)
 * - each wallet expanded once, so loops can't run forever
 * - each wallet's largest few destinations (all transfers to them), dust ignored, hard cap on graph size
 * - stops at exchanges, mixers, bridges and contracts: past them the trail isn't one wallet's
 */

export const MAX_HOPS = 20;
const MAX_NODES = 40;
const CHILDREN = 4; // destinations followed per wallet
const PER_WALLET = 12; // transfers drawn per wallet
const STOP = new Set(['exchange', 'mixer', 'bridge', 'contract']);

// transfers worth less than this (at rough prices) are ignored as dust
const DUST_USD = 25;

export interface TraceResult {
  input: string;
  network: string;
  chain: Chain;
  nodes: TraceNode[];
  edges: TraceEdge[];
  risks: Risk[];
  score: number;
  engine: string; // which detector engine produced the risks
  source: string;
  incomplete: string[]; // wallets whose transfers couldn't be loaded
  crossChain: { attempted: number; followed: number; unmatched: number; errors: number };
}

export function inputKind(input: string): 'tx' | 'wallet' | 'ens' {
  const s = input.trim();
  if (/^0x[a-fA-F0-9]{64}$/.test(s)) return 'tx';
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return 'wallet';
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i.test(s)) return 'ens';
  throw new InputError('Enter a 0x transaction hash, a 0x wallet address or an ENS name');
}

export async function traceCase(input: string, hops = 5, chainId?: string): Promise<TraceResult> {
  const maxHops = Math.max(1, Math.min(MAX_HOPS, Math.floor(hops)));
  const kind = inputKind(input);
  // a tx hash can be found on whichever chain it lives on; wallets need a chain (default Ethereum)
  const chain = kind === 'tx' && (!chainId || chainId === 'auto') ? await findTxChain(input.trim()) : getChain(chainId);
  // rough USD value, used only to rank transfers of different assets against each other
  const nodes = new Map<string, TraceNode>();
  const edges: TraceEdge[] = [];
  const edgeIds = new Set<string>();
  const run = limiter(4);
  let source = `${chain.name} RPC`;
  const incomplete: string[] = [];
  const crossChain = { attempted: 0, followed: 0, unmatched: 0, errors: 0 };

  const nodeId = (network: Chain, id: string) => `${network.id}:${id.toLowerCase()}`;
  const addNode = (network: Chain, address: string, hop: number) => {
    const id = nodeId(network, address);
    if (!nodes.has(id)) nodes.set(id, { id, address: address.toLowerCase(), chain: network.id, hop, type: hop === 0 ? 'source' : 'wallet', risk: 0 });
    return nodes.get(id)!;
  };
  const addEdge = (t: Transfer, network: Chain) => {
    const from = nodeId(network, t.from);
    const to = nodeId(network, t.to);
    const id = `${network.id}:${t.hash}:${t.to}:${t.asset}`;
    if (edgeIds.has(id)) return false;
    edgeIds.add(id);
    const hop = Math.max(nodes.get(from)!.hop + 1, nodes.get(to)!.hop);
    edges.push({ id, from, to, txHash: t.hash, value: t.value, asset: t.asset, timestamp: new Date(t.timestamp * 1000).toISOString(), hop, chain: network.id });
    return true;
  };

  type Frontier = { address: string; chain: Chain; hop: number; fromBlock?: number };
  let frontier: Frontier[] = [];

  if (kind === 'tx') {
    const moved = (await transfersInTx(chain, input.trim())).filter((t) => t.value * usdWeight(chain, t.asset) > 0);
    if (!moved.length) {
      const assets = [chain.native, ...new Set(Object.values(chain.tokens).map((t) => t.symbol))].join(', ');
      throw new NotFoundError(`This transaction moved none of the assets TraceX follows on ${chain.name} (${assets})`);
    }
    const origin = moved[0].from;
    addNode(chain, origin, 0);
    for (const t of moved) {
      addNode(chain, t.from, t.from === origin ? 0 : 1);
      addNode(chain, t.to, 1);
      addEdge(t, chain);
      frontier.push({ address: t.to, chain, hop: 1, fromBlock: t.blockNumber });
    }
  } else {
    const address = kind === 'ens' ? await resolveEns(input.trim()) : input.trim().toLowerCase();
    addNode(chain, address, 0);
    frontier.push({ address, chain, hop: 0 });
  }

  // breadth-first, one hop level at a time
  const expanded = new Set<string>();
  while (frontier.length && nodes.size < MAX_NODES) {
    const next: Frontier[] = [];
    await Promise.all(frontier.map((f) => run(async () => {
      const key = nodeId(f.chain, f.address);
      if (expanded.has(key) || f.hop >= maxHops || nodes.size >= MAX_NODES) return;
      expanded.add(key);
      const node = nodes.get(key)!;
      // look up who it is and what it sent at the same time - both are slow on free APIs
      const [entity, res] = await Promise.all([
        classify(f.chain, f.address),
        outgoing(f.chain, f.address, f.fromBlock == null ? { recent: true } : { fromBlock: f.fromBlock }).catch((e: Error) => e),
      ]);
      if (node.type !== 'source') node.type = entity.type;
      node.label ??= entity.label;
      if (entity.type === 'bridge' && f.hop > 0) {
        const inbound = edges.filter((edge) => edge.to === key && edge.chain === 'ethereum');
        for (const edge of inbound) {
          crossChain.attempted += 1;
          try {
            const sender = nodes.get(edge.from)?.address;
            if (!node.address || !sender) {
              crossChain.unmatched += 1;
              continue;
            }
            const continuations = await followCanonicalBridge(
              f.chain,
              edge.txHash,
              Date.parse(edge.timestamp) / 1000,
              node.address,
              sender,
              edge.asset,
              edge.value,
            );
            if (!continuations.length) crossChain.unmatched += 1;
            for (const continuation of continuations) {
              const destination = getChain(continuation.destinationChain);
              if (nodes.size >= MAX_NODES) break;
              const destinationNode = addNode(destination, continuation.recipient, f.hop + 1);
              const id = `bridge:${continuation.sourceTxHash}:${continuation.destinationChain}:${continuation.destinationTxHash}`;
              if (!edgeIds.has(id)) {
                edgeIds.add(id);
                edges.push({
                  id,
                  from: key,
                  to: destinationNode.id,
                  txHash: continuation.sourceTxHash,
                  destinationTxHash: continuation.destinationTxHash,
                  destinationChain: continuation.destinationChain,
                  chain: continuation.sourceChain,
                  value: continuation.value,
                  asset: continuation.asset,
                  timestamp: new Date(continuation.timestamp * 1000).toISOString(),
                  hop: f.hop + 1,
                });
                next.push({ address: continuation.recipient, chain: destination, hop: f.hop + 1, fromBlock: continuation.destinationBlock });
                crossChain.followed += 1;
              }
            }
          } catch (error) {
            crossChain.errors += 1;
            console.error(`Cross-chain bridge lookup failed for ${edge.txHash}:`, error instanceof Error ? error.message : error);
          }
        }
      }
      if (f.hop > 0 && STOP.has(entity.type)) return;
      // one wallet failing to load shouldn't sink the case - unless it's where we start
      if (res instanceof Error) {
        if (f.hop === 0) throw res;
        incomplete.push(key);
        return;
      }

      source = res.source;
      // the biggest few destinations by total value, with every transfer to them - six 100 ETH
      // deposits into a mixer should show as 600 ETH, not get cut to the top four
      const usd = (t: Transfer) => t.value * usdWeight(f.chain, t.asset);
      const real = res.transfers.filter((t) => t.to !== f.address && usd(t) >= DUST_USD);
      const totals = new Map<string, number>();
      for (const t of real) totals.set(t.to, (totals.get(t.to) ?? 0) + usd(t));
      const top = new Set([...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, CHILDREN).map(([to]) => to));
      const picked = real.filter((t) => top.has(t.to)).sort((a, b) => usd(b) - usd(a)).slice(0, PER_WALLET);
      for (const t of picked) {
        const target = nodeId(f.chain, t.to);
        if (nodes.size >= MAX_NODES && !nodes.has(target)) break;
        const isNew = !nodes.has(target);
        addNode(f.chain, t.to, f.hop + 1);
        if (addEdge(t, f.chain) && isNew) next.push({ address: t.to, chain: f.chain, hop: f.hop + 1, fromBlock: t.blockNumber });
      }
    })));
    frontier = next;
  }

  // label the leaves too - an exchange at the edge of the graph is the most important node
  await Promise.all([...nodes.values()].filter((n) => !expanded.has(n.id)).map((n) => run(async () => {
    const network = getChain(n.chain);
    const entity = await classify(network, n.address ?? n.id);
    if (n.type !== 'source') n.type = entity.type;
    n.label ??= entity.label;
  })));
  const origin = [...nodes.values()].find((n) => n.hop === 0);
  if (origin && !origin.label) origin.label = kind === 'ens' ? input.trim() : kind === 'tx' ? 'Sender' : 'Start wallet';

  const list = [...nodes.values()];
  const { risks, score, engine } = await runAnalysis(list, edges);
  const followedChains = [...new Set(list.map((node) => node.chain).filter((id) => id && id !== chain.id))];
  return {
    input: input.trim(),
    network: followedChains.length ? `${chain.name} + ${followedChains.map((id) => getChain(id).name).join(', ')}` : chain.name,
    chain, nodes: list, edges, risks, score, engine, source, incomplete, crossChain,
  };
}
