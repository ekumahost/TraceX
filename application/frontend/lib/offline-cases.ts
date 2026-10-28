import type { TraceCase, TraceEdge, TraceNode } from './types';
import { SAMPLE_CASE } from './sample-case';

type Preset = { id: string; title: string; edges: string[]; reply: string };

export const OFFLINE_PRESETS: Preset[] = [
  {
    id: 'mixer-trail',
    title: 'Synthetic mixer and peel trail',
    edges: ['drain', 'mix-in', 'peel1', 'side1', 'peel2', 'side2', 'bridge', 'peel3', 'side3', 'cashout', 'mix-out'],
    reply: 'This illustrative case shows a rapid outflow, a mixer deposit, a peel-chain pattern, a bridge interaction, and an exchange-labelled destination. Those are trace patterns in synthetic data, not proof of wrongdoing or a real wallet attribution.',
  },
  {
    id: 'exchange-cashout',
    title: 'Synthetic exchange cash-out',
    edges: ['drain', 'peel1', 'peel2', 'peel3', 'cashout'],
    reply: 'This illustrative case shows funds moving through intermediate wallets to a node labelled as an exchange. An exchange label is a lead to verify, not proof of the account owner or intent.',
  },
  {
    id: 'bridge-passage',
    title: 'Synthetic bridge passage',
    edges: ['drain', 'peel1', 'peel2', 'bridge', 'peel3'],
    reply: 'This illustrative case includes an edge labelled as a bridge interaction. It is not a real bridge deposit and does not demonstrate a live cross-chain match.',
  },
];

function hex(seed: string, length: number) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  let result = '';
  while (result.length < length) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    result += (state >>> 0).toString(16).padStart(8, '0');
  }
  return `0x${result.slice(0, length)}`;
}

function buildCase(preset: Preset): TraceCase {
  const selectedEdges = SAMPLE_CASE.edges.filter((edge) => preset.edges.includes(edge.id));
  const selectedNodeIds = new Set(selectedEdges.flatMap((edge) => [edge.from, edge.to]));
  const addressById = new Map<string, string>();
  const txByHash = new Map<string, string>();
  const toAddress = (id: string) => {
    if (!addressById.has(id)) addressById.set(id, hex(`${preset.id}:address:${id}`, 40));
    return addressById.get(id)!;
  };
  const toTx = (hash: string) => {
    if (!txByHash.has(hash)) txByHash.set(hash, hex(`${preset.id}:tx:${hash}`, 64));
    return txByHash.get(hash)!;
  };

  const nodes: TraceNode[] = SAMPLE_CASE.nodes
    .filter((node) => selectedNodeIds.has(node.id))
    .map((node) => {
      const address = toAddress(node.id);
      return { ...node, id: address, address, chain: 'ethereum' };
    });
  const edges: TraceEdge[] = selectedEdges.map((edge) => ({
    ...edge,
    from: toAddress(edge.from),
    to: toAddress(edge.to),
    txHash: toTx(edge.txHash),
    chain: 'ethereum',
  }));
  const nodeByOriginalAddress = new Map(
    SAMPLE_CASE.nodes.map((node) => [node.id, toAddress(node.id)]),
  );
  const risks = SAMPLE_CASE.risks
    .filter((risk) => risk.tx && edges.some((edge) => edge.id === SAMPLE_CASE.edges.find((candidate) => candidate.txHash === risk.tx)?.id))
    .map((risk) => ({
      ...risk,
      tx: risk.tx ? toTx(risk.tx) : undefined,
      address: risk.address ? nodeByOriginalAddress.get(risk.address) : undefined,
    }));

  return {
    input: nodes.find((node) => node.type === 'source')?.address ?? nodes[0]?.address ?? 'offline-demo',
    network: 'Offline demo · Ethereum',
    chain: 'ethereum',
    source: 'Bundled synthetic fixture · no network requests',
    nodes,
    edges,
    risks,
    sample: true,
    demo: { id: preset.id, title: preset.title },
  };
}

export const OFFLINE_CASES = Object.fromEntries(
  OFFLINE_PRESETS.map((preset) => [preset.id, { data: buildCase(preset), reply: preset.reply }]),
) as Record<string, { data: TraceCase; reply: string }>;

export const getOfflineCase = (query: string) => {
  const id = query.startsWith('demo:') ? query.slice('demo:'.length) : '';
  return OFFLINE_CASES[id];
};
