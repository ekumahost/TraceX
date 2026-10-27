'use client';
import { useEffect, useState } from 'react';
import { RefreshCw, Sparkles, TriangleAlert } from 'lucide-react';
import type { AIAnswer, TraceCase } from '@/lib/types';
import { PROVIDER_LABEL } from '@/lib/api';
import { ruleBrief } from '@/lib/rule-brief';
import { RichText } from './RichText';
import type { Selection } from './TraceGraph';

export type BriefState =
  | { status: 'loading' }
  | { status: 'done'; answer: AIAnswer }
  | { status: 'error'; error: string };

// Reveals text progressively, like the model is writing it
function useTypewriter(text: string, enabled: boolean) {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) return setN(text.length);
    setN(0);
    let raf = 0, last = performance.now(), i = 0;
    const step = (now: number) => {
      i = Math.min(text.length, i + Math.max(2, Math.round((now - last) / 6)));
      last = now;
      setN(i);
      if (i < text.length) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled]);
  return { shown: text.slice(0, n), typing: n < text.length };
}

export function AIBrief({ data, state, onRetry, onCite }: { data: TraceCase; state: BriefState; onRetry: () => void; onCite: (s: Selection) => void }) {
  const text = state.status === 'done' ? state.answer.text : '';
  const { shown, typing } = useTypewriter(text, state.status === 'done');

  if (state.status === 'loading') {
    return (
      <div className='p-5'>
        <div className='flex items-center gap-2 text-[13px] text-muted'>
          <Sparkles className='h-4 w-4 animate-pulse text-cyan' /> Reading the graph and flags…
        </div>
        <div className='mt-6 space-y-3'>
          {[92, 100, 78, 0, 60, 96, 84, 70].map((w, i) =>
            w ? <div key={i} className='shimmer h-3' style={{ width: `${w}%` }} /> : <div key={i} className='h-3' />,
          )}
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className='p-5'>
        <div className='rounded-lg border border-[rgba(255,181,71,.3)] bg-[rgba(255,181,71,.06)] p-4'>
          <div className='flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[.14em] text-risk-medium'>
            <TriangleAlert className='h-4 w-4' /> AI brief unavailable
          </div>
          <p className='mt-2 text-[13px] leading-relaxed text-muted'>
            {/(Failed to fetch|NetworkError|Load failed)/i.test(state.error)
              ? 'The TraceX backend isn’t reachable. Start it with npm run dev in application/backend.'
              : /key missing|credentials missing/i.test(state.error)
                ? 'No AI provider key is set on the backend yet.'
                : state.error}
          </p>
          {/key missing|credentials missing/i.test(state.error) && (
            <p className='mt-2 text-[12.5px] text-dim'>Add META_API_KEY to application/backend/.env to enable Muse Spark.</p>
          )}
          <button type='button' onClick={onRetry} className='btn btn--ghost btn--sm mt-4'><RefreshCw /> Retry</button>
        </div>
        <div className='mt-6 flex items-center justify-between'>
          <span className='eyebrow eyebrow--gold !text-[10.5px]'>Rule-based summary</span>
          <span className='chip'>No AI</span>
        </div>
        <div className='mt-4'><RichText text={ruleBrief(data)} data={data} onCite={onCite} /></div>
      </div>
    );
  }

  const p = PROVIDER_LABEL[state.answer.provider];
  return (
    <div className='p-5'>
      <div className='mb-5 flex items-center justify-between gap-2'>
        <span className='chip tone-low'><Sparkles className='h-3 w-3' /> {p.model}</span>
        <span className='text-[11.5px] text-dim'>via {p.via}</span>
      </div>
      <RichText text={shown} data={data} onCite={onCite} typing={typing} />
      {!typing && (
        <p className='mt-6 border-t border-line pt-4 text-[12px] text-dim'>
          Generated from this case’s graph and flags. Click a citation to see the transaction it refers to.
        </p>
      )}
    </div>
  );
}
