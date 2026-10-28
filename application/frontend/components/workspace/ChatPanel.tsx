'use client';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowUp } from 'lucide-react';
import type { TraceCase } from '@/lib/types';
import { askCase, PROVIDER_LABEL } from '@/lib/api';
import { Adinkra } from '../Adinkra';
import { RichText } from './RichText';
import type { Selection } from './TraceGraph';

type Msg = { role: 'user' | 'ai' | 'error'; text: string; via?: string };

const SUGGESTIONS = ['Did these funds touch a mixer?', 'Where did the money end up?', 'Which address should we ask an exchange about?'];

export function ChatPanel({ data, onCite }: { data: TraceCase; onCite: (s: Selection) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, busy]);

  const ask = async (question: string) => {
    if (!question.trim() || busy) return;
    setQ('');
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    setBusy(true);
    try {
      const a = await askCase(question, data);
      setMsgs((m) => [...m, { role: 'ai', text: a.text, via: PROVIDER_LABEL[a.provider].model }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: 'error', text: e.message }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='flex h-full flex-col'>
      <div className='scroll-thin flex-1 space-y-4 overflow-y-auto p-5'>
        {!msgs.length && (
          <div className='pt-4 text-center'>
            <Adinkra name='mateMasie' className='mx-auto h-10 w-10 text-gold' />
            <p className='mx-auto mt-4 max-w-[30ch] font-serif text-[19px] italic text-white/80'>Ask about this trail. Check any linked transaction citations against the source.</p>
            <div className='mt-6 flex flex-col gap-2'>
              {SUGGESTIONS.map((s) => (
                <button key={s} type='button' onClick={() => ask(s)} className='rounded-lg border border-line bg-panel-2 px-4 py-3 text-left text-[13.5px] text-muted transition-colors hover:border-[var(--line-v)] hover:text-cream'>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={clsx('flex', m.role === 'user' && 'justify-end')}>
            {m.role === 'user' ? (
              <div className='max-w-[85%] rounded-xl rounded-br-sm bg-violet px-4 py-2.5 text-[14px] text-white'>{m.text}</div>
            ) : m.role === 'error' ? (
              <div className='max-w-[92%] rounded-xl border border-[rgba(255,181,71,.3)] bg-[rgba(255,181,71,.06)] px-4 py-3 text-[13px] text-muted'>
                Couldn’t get an answer: {m.text}
              </div>
            ) : (
              <div className='max-w-[95%] rounded-xl rounded-bl-sm border border-line bg-panel-2 px-4 py-3'>
                <div className='mb-2 font-display text-[10px] font-bold uppercase tracking-[.18em] text-cyan'>{m.via}</div>
                <RichText text={m.text} data={data} onCite={onCite} />
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className='flex gap-1.5 px-2'>
            {[0, 1, 2].map((i) => <span key={i} className='h-2 w-2 animate-bounce rounded-full bg-cyan' style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className='border-t border-line p-3'>
        <div className='flex items-center gap-2 rounded-lg border border-line-2 bg-panel-2 py-1.5 pl-4 pr-1.5 focus-within:border-[var(--line-v)]'>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Ask about this case…' className='input flex-1 py-1.5 !font-display !text-[14px]' aria-label='Question about this case' />
          <button type='submit' disabled={!q.trim() || busy} className='grid h-9 w-9 place-items-center rounded-md bg-violet text-white transition-opacity disabled:opacity-30' aria-label='Send'>
            <ArrowUp className='h-4 w-4' />
          </button>
        </div>
      </form>
    </div>
  );
}
