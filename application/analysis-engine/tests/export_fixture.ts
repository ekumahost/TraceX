// Regenerates tests/fixtures/sample_case.json from the frontend sample case and the
// backend's TypeScript detectors:  npx tsx analysis-engine/tests/export_fixture.ts  (from application/)
import { writeFileSync } from 'fs';
import { join } from 'path';
import { SAMPLE_CASE } from '../../frontend/lib/sample-case';
import { analyze, scoreRisks } from '../../backend/src/services/heuristics';

const nodes = SAMPLE_CASE.nodes.map((n) => ({ ...n, risk: 0 }));
const edges = SAMPLE_CASE.edges;
const input = { nodes: nodes.map((n) => ({ ...n })), edges };
const risks = analyze(nodes as any, edges as any);
const nodeRisk = Object.fromEntries(nodes.map((n) => [n.id, n.risk]));
writeFileSync(join(__dirname, 'fixtures/sample_case.json'), JSON.stringify({ input, expected: { risks, nodeRisk } }, null, 2));
console.log(`wrote ${risks.length} risks`);

// funds passing through two exchanges - exercises the exchange-hopping detector
const t = '2026-10-14T02:11:00.000Z';
const hopNodes = [
  { id: '0xs', type: 'source', hop: 0, risk: 0 }, { id: '0xe1', type: 'exchange', hop: 1, label: 'Exchange A', risk: 0 },
  { id: '0xw', type: 'wallet', hop: 2, risk: 0 }, { id: '0xe2', type: 'exchange', hop: 3, label: 'Exchange B', risk: 0 },
];
const hopEdges = [
  { id: '1', from: '0xs', to: '0xe1', txHash: '0x1', value: 5, asset: 'ETH', timestamp: t, hop: 1 },
  { id: '2', from: '0xe1', to: '0xw', txHash: '0x2', value: 5, asset: 'ETH', timestamp: t, hop: 2 },
  { id: '3', from: '0xw', to: '0xe2', txHash: '0x3', value: 5, asset: 'ETH', timestamp: t, hop: 3 },
];
const hopInput = { nodes: hopNodes.map((n) => ({ ...n })), edges: hopEdges };
const hopRisks = analyze(hopNodes as any, hopEdges as any);
writeFileSync(join(__dirname, 'fixtures/exchange_hop.json'), JSON.stringify({
  input: hopInput, expected: { risks: hopRisks, nodeRisk: Object.fromEntries(hopNodes.map((n) => [n.id, n.risk])) },
}, null, 2));
console.log(`wrote ${hopRisks.length} exchange-hop risks`);

// six 100 ETH deposits from one wallet into a mixer - must be one grouped finding
const depNodes = [
  { id: '0xf', type: 'source', hop: 0, risk: 0 }, { id: '0xd', type: 'wallet', hop: 1, risk: 0 },
  { id: '0xm', type: 'mixer', hop: 2, label: 'Tornado Cash 100 ETH', risk: 0 },
];
const depEdges = [
  { id: 'f', from: '0xf', to: '0xd', txHash: '0xfund', value: 600.099, asset: 'ETH', timestamp: '2026-10-28T06:25:47.000Z', hop: 1 },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ id: `d${i}`, from: '0xd', to: '0xm', txHash: `0xdep${i}`, value: 100, asset: 'ETH', timestamp: `2026-10-28T06:2${8 + Math.floor(i / 3)}:${10 + i * 7}.000Z`, hop: 2 })),
];
const depInput = { nodes: depNodes.map((n) => ({ ...n })), edges: depEdges };
const depRisks = analyze(depNodes as any, depEdges as any);
writeFileSync(join(__dirname, 'fixtures/mixer_deposits.json'), JSON.stringify({
  input: depInput, expected: { risks: depRisks, nodeRisk: Object.fromEntries(depNodes.map((n) => [n.id, n.risk])), score: scoreRisks(depRisks) },
}, null, 2));
console.log(`wrote ${depRisks.length} mixer-deposit risks:`, depRisks.map((r) => r.detail));
