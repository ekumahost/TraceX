'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Check, Loader2, TriangleAlert } from 'lucide-react';
import { API_URL } from '@/lib/api';

/**
 * The backend runs on a free host that sleeps after ~15 idle minutes and takes up to a minute
 * to wake. Ping it as soon as any page opens; if it's slow to answer, tell the visitor to wait.
 */
type State = 'checking' | 'waking' | 'ready' | 'down' | 'hidden';

const SHOW_AFTER_MS = 2000;
const GIVE_UP_MS = 90_000;

export function ServerWake() {
  const [state, setState] = useState<State>('checking');
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let done = false;
    const started = Date.now();
    const show = setTimeout(() => !done && setState('waking'), SHOW_AFTER_MS);
    const tick = setInterval(() => setSeconds(Math.round((Date.now() - started) / 1000)), 1000);
    fetch(`${API_URL}/`, { signal: AbortSignal.timeout(GIVE_UP_MS), cache: 'no-store' })
      .then((res) => {
        done = true;
        if (!res.ok) throw new Error();
        // only celebrate if we had to make the visitor wait
        setState((s) => (s === 'waking' ? 'ready' : 'hidden'));
        setTimeout(() => setState('hidden'), 2500);
      })
      .catch(() => {
        done = true;
        setState('down');
      })
      .finally(() => clearInterval(tick));
    return () => { clearTimeout(show); clearInterval(tick); };
  }, []);

  if (state === 'checking' || state === 'hidden') return null;

  return (
    <div role='status' aria-live='polite' className='fixed inset-x-0 bottom-5 z-[95] flex justify-center px-4'>
      <div
        className={clsx(
          'flex max-w-[560px] items-start gap-3 rounded-xl border px-5 py-3.5 text-[13px] leading-relaxed shadow-2xl backdrop-blur-md',
          state === 'down' ? 'border-[rgba(255,181,71,.35)] bg-[rgba(30,22,8,.92)] text-gold-soft' : 'border-line-2 bg-[rgba(15,15,26,.94)] text-cream',
        )}
      >
        {state === 'waking' && <Loader2 className='mt-0.5 h-4 w-4 flex-none animate-spin text-cyan' />}
        {state === 'ready' && <Check className='mt-0.5 h-4 w-4 flex-none text-risk-clean' />}
        {state === 'down' && <TriangleAlert className='mt-0.5 h-4 w-4 flex-none' />}
        <div>
          {state === 'waking' && (
            <>
              <strong className='font-display'>Waking up the TraceX server… {seconds}s</strong>
              <div className='text-muted'>It runs on free hosting that sleeps when idle, so the first visit can take up to 60 seconds. Thanks for waiting - after that it’s fast.</div>
            </>
          )}
          {state === 'ready' && <strong className='font-display'>Server ready - go ahead.</strong>}
          {state === 'down' && (
            <>
              <strong className='font-display'>The TraceX server isn’t answering right now.</strong>
              <div>Please refresh in a minute. Meanwhile the sample case and offline demos work without it.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
