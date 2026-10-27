import { SAMPLE_CASE } from '@/lib/sample-case';
import { layoutByHop, COL } from '@/lib/layout';
import { fmtValue, riskTone } from '@/lib/format';

const TONE_COLOR = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--cyan)', clean: 'var(--green)' };

// Static SVG render of the sample case for the landing page - same data and layout as the workspace
export function CasePreview() {
  const { nodes, edges } = SAMPLE_CASE;
  const pos = layoutByHop(nodes);
  const ys = [...pos.values()].map((p) => p.y);
  const pad = 70;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  const maxX = Math.max(...nodes.map((n) => n.hop)) * COL;
  const vb = `${-pad} ${minY} ${maxX + pad * 2} ${maxY - minY}`;

  return (
    <svg viewBox={vb} className='h-full w-full' role='img' aria-label='Fund-flow graph of the sample case'>
      {edges.map((e, i) => {
        const a = pos.get(e.from)!, b = pos.get(e.to)!;
        const mx = (a.x + b.x) / 2;
        const d = `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
        const hot = nodes.find((n) => n.id === e.to)!.risk >= 70;
        return (
          <g key={e.id}>
            <path d={d} fill='none' stroke={hot ? 'rgba(255,77,109,.35)' : 'rgba(154,141,255,.28)'} strokeWidth={1.5 + Math.log10(e.value + 1) * 1.6} />
            <path d={d} fill='none' stroke={hot ? 'var(--red)' : 'var(--cyan)'} strokeWidth='1.6' className='flow-path' style={{ animationDelay: `${i * -0.2}s` }} />
            {e.value >= 20 && (
              <text x={mx} y={(a.y + b.y) / 2 - 8} textAnchor='middle' className='mono' fontSize='13' fill='var(--muted)'>
                {fmtValue(e.value)}
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
              <rect x={-r} y={-r} width={r * 2} height={r * 2} rx='4' transform='rotate(45)' fill='var(--panel-2)' stroke={tone} strokeWidth='2' />
            ) : (
              <circle r={r} fill='var(--panel-2)' stroke={n.type === 'source' ? 'var(--gold)' : tone} strokeWidth='2' />
            )}
            {n.label && (
              <text y={r + 24} textAnchor='middle' fontSize='13' fontWeight='700' fill='var(--cream)' style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontFamily: 'var(--f-display)' }}>
                {n.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
