'use client';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Mark } from '../Logo';

// BoxLife-style intro: the mark assembles, a serif line, a progress hairline. Once per session.
export function Loader({ onDone }: { onDone: () => void }) {
  const [state, setState] = useState<'show' | 'done' | 'gone'>('show');

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem('tracex-intro') === '1'; } catch {}
    if (seen) { setState('gone'); onDone(); return; }
    try { sessionStorage.setItem('tracex-intro', '1'); } catch {}
    const t1 = setTimeout(() => { setState('done'); onDone(); }, 1500);
    const t2 = setTimeout(() => setState('gone'), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  if (state === 'gone') return null;
  return (
    <div className={clsx('loader', state === 'done' && 'is-done')} aria-hidden='true'>
      <Mark className='loader-mark' />
      <p className='loader-text'>Following the money…</p>
      <div className='loader-bar'><i /></div>
    </div>
  );
}
