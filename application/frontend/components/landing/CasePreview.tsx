import { SAMPLE_CASE } from '@/lib/sample-case';
import type { TraceCase } from '@/lib/types';
import { layoutByHop, COL } from '@/lib/layout';
import { fmtValue, riskTone } from '@/lib/format';

const TONE_COLOR = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--cyan)', clean: 'var(--green)' };

// Static SVG render of a case - the landing page preview and the printed report.
// Same layout as the workspace graph; `light` switches to ink-on-paper colours for print.
export function CasePreview({ data = SAMPLE_CASE, light = false }: { data?: TraceCase; light?: boolean }) {
  const { nodes, edges } = data;
  const fill = light ? '#ffffff' : 'var(--panel-2)';
  const text = light ? '#111118' : 'var(--cream)';
  const muted = light ? '#55536b' : 'var(--muted)';
  if (!nodes.length) return null;
  const pos = layoutByHop(nodes);
  const ys = [...pos.values()].map((p) => p.y);
  const padX = 130, padY = 70; // room for labels on the outer columns
  const minY = Math.min(...ys) - padY, maxY = Math.max(...ys) + padY;
  const maxX = Math.max(...nodes.map((n) => n.hop)) * COL;
  const vb = `${-padX} ${minY} ${maxX + padX * 2} ${maxY - minY}`;
  // repeated transfers between the same pair draw as one flow: "600 ETH · 6 tx"
  const flows = new Map<string, { from: string; to: string; asset: string; total: number; n: number }>();
  for (const e of edges) {
    const key = `${e.from}|${e.to}|${e.asset}`;
    const f = flows.get(key) ?? { from: e.from, to: e.to, asset: e.asset, total: 0, n: 0 };
    f.total += e.value; f.n += 1;
    flows.set(key, f);
  }

  return (
    <svg viewBox={vb} className='h-full w-full' role='img' aria-label='Fund-flow graph'>
      {[...flows.entries()].map(([key, f], i) => {
        const a = pos.get(f.from), b = pos.get(f.to);
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2;
        const d = `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
        const hot = (nodes.find((n) => n.id === f.to)?.risk ?? 0) >= 70;
        return (
          <g key={key}>
            <path d={d} fill='none' stroke={hot ? 'rgba(255,77,109,.35)' : 'rgba(154,141,255,.28)'} strokeWidth={1.5 + Math.log10(f.total + 1) * 1.6} />
            <path d={d} fill='none' stroke={hot ? 'var(--red)' : light ? '#6d5bff' : 'var(--cyan)'} strokeWidth='1.6' className={light ? undefined : 'flow-path'} strokeDasharray={light ? '6 6' : undefined} style={{ animationDelay: `${i * -0.2}s` }} />
            {(light || f.total >= 20) && (
              <text x={mx} y={(a.y + b.y) / 2 - 8} textAnchor='middle' className='mono' fontSize='13' fill={muted}>
                {fmtValue(f.total, f.asset)}{f.n > 1 ? ` · ${f.n} tx` : ''}
              </text>
            )}
          </g>
        );
      })}
      {nodes.map((n) => {
        const p = pos.get(n.id)!;
        const tone = TONE_COLOR[riskTone(n.risk)];
        const r = n.type === 'wallet' && !n.label ? 9 : 15;
        return (
          <g key={n.id} transform={`translate(${p.x},${p.y})`}>
            {n.risk >= 70 && <circle r={r + 10} fill='none' stroke={tone} strokeOpacity='.35' />}
            {n.type === 'mixer' || n.type === 'exchange' || n.type === 'bridge' ? (
              <rect x={-r} y={-r} width={r * 2} height={r * 2} rx='4' transform='rotate(45)' fill={fill} stroke={tone} strokeWidth='2' />
            ) : (
              <circle r={r} fill={fill} stroke={n.type === 'source' ? 'var(--gold)' : tone} strokeWidth='2' />
            )}
            {n.label && (
              <text y={r + 24} textAnchor='middle' fontSize='13' fontWeight='700' fill={text} style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: 'var(--f-display)' }}>
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
