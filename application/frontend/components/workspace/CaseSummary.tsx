'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { TraceCase } from '@/lib/types';
import { caseScore, caseStats, fmtDuration, fmtValue, RISK_TITLE, verdict } from '@/lib/format';
import { Adinkra, ADINKRA } from '../Adinkra';
import type { Selection } from './TraceGraph';

const TONE = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--cyan)', clean: 'var(--green)' };

function RiskGauge({ score }: { score: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(score), 250);
    return () => clearTimeout(t);
  }, [score]);
  const v = verdict(score);
  const r = 62, c = 2 * Math.PI * r, arc = c * 0.75;
  return (
    <div className='relative mx-auto h-[168px] w-[168px]'>
      <svg viewBox='0 0 160 160' className='h-full w-full rotate-[135deg]'>
        <circle cx='80' cy='80' r={r} fill='none' stroke='var(--panel-3)' strokeWidth='10' strokeDasharray={`${arc} ${c}`} strokeLinecap='round' />
        <circle
          cx='80' cy='80' r={r} fill='none' stroke={TONE[v.tone]} strokeWidth='10' strokeLinecap='round'
          strokeDasharray={`${arc} ${c}`} strokeDashoffset={arc - (arc * shown) / 100}
          style={{ transition: 'stroke-dashoffset 1.6s var(--ease)', filter: `drop-shadow(0 0 10px ${TONE[v.tone]})` }}
        />
      </svg>
      <div className='absolute inset-0 grid place-content-center text-center'>
        <div className='display text-[46px] leading-none'>{score}</div>
        <div className='mt-1 font-display text-[10.5px] font-bold uppercase tracking-[.2em]' style={{ color: TONE[v.tone] }}>{v.label}</div>
      </div>
    </div>
  );
}

export function CaseSummary({ data, onSelect }: { data: TraceCase; onSelect: (s: Selection) => void }) {
  const score = data.score ?? caseScore(data.risks);
  const s = caseStats(data);
  const pick = (tx?: string, address?: string) => {
    const edge = tx && data.edges.find((e) => e.txHash === tx);
    if (edge) return onSelect({ kind: 'edge', id: edge.id });
    if (address) onSelect({ kind: 'node', id: address });
  };

  return (
    <div className='flex flex-col gap-6 p-5'>
      <div>
        <div className='flex items-center justify-between'>
          <span className='eyebrow eyebrow--gold !text-[10.5px]'>Case score</span>
          <span title={`${ADINKRA.hwehwemudua.name} - ${ADINKRA.hwehwemudua.meaning}`}>
            <Adinkra name='hwehwemudua' className='h-5 w-5 text-gold' />
          </span>
        </div>
        <div className='mt-4'><RiskGauge score={score} /></div>
      </div>

      <dl className='grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-[var(--line)] text-center'>
        {[
          ['Moved', fmtValue(s.moved, s.asset)],
          ['Span', s.span ? fmtDuration(s.span) : '-'],
          ['Wallets', s.wallets],
          ['Hops', s.hops],
        ].map(([k, v]) => (
          <div key={k} className='bg-panel px-2 py-3.5'>
            <dt className='font-display text-[10px] font-bold uppercase tracking-[.18em] text-dim'>{k}</dt>
            <dd className='mt-1 font-display text-[15px] font-bold text-cream'>{v}</dd>
          </div>
        ))}
      </dl>

      <div>
        <span className='eyebrow !text-[10.5px]'>Flags · {data.risks.length}</span>
        <ul className='mt-4 flex flex-col gap-2'>
          {data.risks.map((r, i) => (
            <li key={i}>
              <button
                type='button'
                onClick={() => pick(r.tx, r.address)}
                className={clsx('group w-full rounded-lg border border-line bg-panel-2 p-3.5 text-left transition-colors hover:border-[var(--line-2)]', `tone-${r.severity}`)}
                style={{ borderLeft: '3px solid var(--tone)' }}
              >
                <div className='flex items-center justify-between gap-2'>
                  <span className='font-display text-[12.5px] font-bold text-cream'>{r.title ?? RISK_TITLE[r.type] ?? r.type}</span>
                  <span className={clsx('chip !px-2 !py-1 !text-[9.5px]', `tone-${r.severity}`)}>{r.severity}</span>
                </div>
                {r.detail && <p className='mt-1.5 text-[12.5px] leading-relaxed text-muted'>{r.detail}</p>}
              </button>
            </li>
          ))}
          {!data.risks.length && <li className='text-[13px] text-dim'>No suspicious patterns detected.</li>}
        </ul>
      </div>
    </div>
  );
}
