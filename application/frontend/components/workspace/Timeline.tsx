'use client';
import clsx from 'clsx';
import type { TraceCase } from '@/lib/types';
import { fmtDuration, fmtTime, fmtValue, short } from '@/lib/format';
import { Adinkra, ADINKRA } from '../Adinkra';
import type { Selection } from './TraceGraph';
import { ChainMark } from './ChainMarks';

export function Timeline({ data, selection, onSelect }: { data: TraceCase; selection: Selection; onSelect: (s: Selection) => void }) {
  const events = [...data.edges].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));
  const t0 = events[0] ? +new Date(events[0].timestamp) : 0;
  const flagged = new Set(data.risks.map((r) => r.tx).filter(Boolean));
  const node = (id: string) => data.nodes.find((n) => n.id === id);
  const name = (id: string) => node(id)?.label ?? short(node(id)?.address ?? id, 6, 4);

  return (
    <div className='p-5'>
      <div className='mb-6 flex items-center gap-3'>
        <Adinkra name='sankofa' className='h-8 w-8 text-gold' />
        <div>
          <div className='adinkra-name'>{ADINKRA.sankofa.name}</div>
          <div className='adinkra-meaning !text-[13.5px]'>{ADINKRA.sankofa.meaning}</div>
        </div>
      </div>
      <ol className='relative ml-2 border-l border-line-2'>
        {events.map((e) => {
          const on = selection?.kind === 'edge' && selection.id === e.id;
          const delta = +new Date(e.timestamp) - t0;
          return (
            <li key={e.id} className='relative pb-5 pl-6'>
              <span
                className={clsx('absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full border-2 border-ink', flagged.has(e.txHash) ? 'bg-risk-high' : 'bg-violet-hi', on && 'ring-2 ring-cyan')}
              />
              <button type='button' onClick={() => onSelect({ kind: 'edge', id: e.id })} className={clsx('w-full rounded-lg p-2.5 text-left transition-colors hover:bg-panel-2', on && 'bg-panel-2')}>
                <div className='flex items-baseline justify-between gap-3'>
                  <span className='font-display text-[11px] font-bold uppercase tracking-[.16em] text-gold'>{delta ? `T + ${fmtDuration(delta)}` : 'T 0'}</span>
                  <span className='mono text-[12.5px] text-cream'>{fmtValue(e.value, e.asset)}</span>
                </div>
                <div className='mt-1 flex items-center gap-1.5 text-[13px] text-muted'>
                  <ChainMark chain={node(e.from)?.chain ?? e.chain ?? data.chain} className='h-4 min-w-4 px-1 text-[7px]' />
                  {name(e.from)} → {name(e.to)}
                  {e.destinationTxHash && <><ChainMark chain={e.destinationChain} className='h-4 min-w-4 px-1 text-[7px]' /><span>bridge finalized</span></>}
                </div>
                <div className='mt-0.5 text-[11px] text-dim'>{fmtTime(e.timestamp)}</div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
