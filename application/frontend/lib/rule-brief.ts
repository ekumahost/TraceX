import type { TraceCase } from './types';
import { caseScore, caseStats, fmtDuration, fmtValue, RISK_TITLE, verdict } from './format';

/**
 * Deterministic summary built only from the heuristics - no model involved.
 * Shown (and labelled as such) when no AI provider is reachable.
 */
export function ruleBrief(c: TraceCase) {
  const s = caseStats(c);
  const score = caseScore(c.risks);
  const origin = c.nodes.find((n) => n.type === 'source') ?? c.nodes[0];
  const first = c.edges.find((e) => e.from === origin?.id);
  const exits = c.nodes.filter((n) => n.type === 'exchange' || n.type === 'bridge');

  const lines = [
    '### Summary',
    `${fmtValue(s.moved, s.asset)} left the origin wallet ${origin?.id ?? ''}${first ? ` in ${first.txHash}` : ''} and spread across ${s.wallets} wallets over ${s.hops} hops${s.span ? ` within ${fmtDuration(s.span)}` : ''}. Case score: **${score}/100 (${verdict(score).label})**.`,
    '### Flags',
    ...c.risks.map((r) => `- **${r.title ?? RISK_TITLE[r.type] ?? r.type}** (${r.severity}): ${r.detail ?? ''}${r.tx ? ` Evidence: ${r.tx}` : ''}`),
  ];
  if (exits.length) {
    lines.push('### Where the trail leaves the chain');
    for (const n of exits) {
      const inbound = c.edges.filter((e) => e.to === n.id);
      lines.push(`- ${n.id} received ${fmtValue(inbound.reduce((a, e) => a + e.value, 0), s.asset)}${inbound[0] ? ` via ${inbound[0].txHash}` : ''}.`);
    }
  }
  const has = (t: string) => c.nodes.some((n) => n.type === t);
  const next = [
    has('exchange') && '- Request KYC records for the exchange deposit address.',
    has('bridge') && '- Follow the bridge transfer on the destination chain.',
    has('mixer') && '- Watch wallets funded from the mixer for further movement.',
  ].filter(Boolean) as string[];
  if (next.length) lines.push('### Next steps', ...next);
  return lines.join('\n');
}
