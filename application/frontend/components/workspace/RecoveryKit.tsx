'use client';
import { useState } from 'react';
import { Copy, Download, FileText, Loader2, ShieldAlert } from 'lucide-react';
import type { RecoveryDocuments, RecoveryLanguage, TraceCase } from '@/lib/types';
import { generateRecoveryKit } from '@/lib/api';

const LANGUAGES: { id: RecoveryLanguage; label: string }[] = [
  { id: 'english', label: 'English' },
  { id: 'pidgin', label: 'Nigerian Pidgin' },
  { id: 'igbo', label: 'Igbo' },
  { id: 'yoruba', label: 'Yoruba' },
  { id: 'hausa', label: 'Hausa' },
];

type State = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string } | { status: 'done'; documents: RecoveryDocuments };

function saveText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DocumentCard({ title, name, text }: { title: string; name: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
      setCopyError('Clipboard access is unavailable. Use Download draft instead.');
    }
  };

  return (
    <article className='overflow-hidden rounded-lg border border-line bg-panel-2'>
      <div className='flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2'>
        <h3 className='font-display text-[11px] font-bold uppercase tracking-[.12em] text-cream'>{title}</h3>
        <div className='flex gap-2'>
          <button type='button' onClick={copy} className='btn btn--ghost btn--sm' aria-label={`Copy ${title}`}><Copy /> {copied ? 'Copied' : 'Copy'}</button>
          <button type='button' onClick={() => saveText(name, text)} className='btn btn--ghost btn--sm' aria-label={`Download ${title}`}><Download /> Save</button>
        </div>
      </div>
      <pre className='max-h-[320px] overflow-auto whitespace-pre-wrap break-words p-3 font-sans text-[12.5px] leading-relaxed text-muted'>{text}</pre>
      {copyError && <p role='alert' className='px-3 pb-3 text-[11px] text-risk-medium'>{copyError}</p>}
    </article>
  );
}

export function RecoveryKit({ data }: { data: TraceCase }) {
  const knownExchange = data.nodes.find((node) => node.type === 'exchange')?.label ?? '';
  const [exchange, setExchange] = useState(knownExchange);
  const [language, setLanguage] = useState<RecoveryLanguage>('english');
  const [state, setState] = useState<State>({ status: 'idle' });

  const generate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (data.sample) return;
    setState({ status: 'loading' });
    try {
      setState({ status: 'done', documents: await generateRecoveryKit(data, exchange.trim(), language) });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Recovery Kit generation failed.' });
    }
  };

  if (data.sample) {
    return (
      <div className='p-5'>
        <div className='rounded-lg border border-[rgba(240,180,76,.3)] bg-[rgba(240,180,76,.06)] p-4 text-[13px] leading-relaxed text-gold-soft'>
          Recovery documents are disabled for synthetic sample data. Run a live trace first so every draft is based on real case evidence.
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-5 p-5'>
      <div className='flex items-center gap-2 text-[13px] text-cream'><FileText className='h-4 w-4 text-cyan' /> Recovery Kit drafts</div>
      <p className='text-[12.5px] leading-relaxed text-muted'>
        Generate an exchange preservation request and a police incident-report draft from this trace in your chosen language.
      </p>
      <div className='rounded-lg border border-[rgba(255,181,71,.3)] bg-[rgba(255,181,71,.06)] p-3 text-[11.5px] leading-relaxed text-gold-soft'>
        <ShieldAlert className='mr-1.5 inline h-4 w-4 align-[-3px]' />
        Drafts only—TraceX never sends them. Review every detail, replace placeholders, and verify all citations. They are not legal advice or official forms.
      </div>

      <form onSubmit={generate} className='space-y-3'>
        <label className='block'>
          <span className='font-display text-[10px] font-bold uppercase tracking-[.14em] text-dim'>Exchange to notify</span>
          <input
            value={exchange}
            onChange={(event) => setExchange(event.target.value)}
            maxLength={100}
            required
            placeholder='Exchange name (optional)'
            className='input mt-1.5 w-full rounded-lg border border-line-2 bg-panel-2 px-3 py-2.5 text-[13px]'
          />
          {!knownExchange && <span className='mt-1 block text-[10.5px] text-dim'>No exchange in this trace yet - leave blank and the request uses an [EXCHANGE NAME] placeholder.</span>}
        </label>
        <label className='block'>
          <span className='font-display text-[10px] font-bold uppercase tracking-[.14em] text-dim'>Draft language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as RecoveryLanguage)}
            className='input mt-1.5 w-full rounded-lg border border-line-2 bg-panel-2 px-3 py-2.5 text-[13px]'
          >
            {LANGUAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button type='submit' disabled={state.status === 'loading'} className='btn btn--sm w-full'>
          {state.status === 'loading' ? <><Loader2 className='animate-spin' /> Drafting with Muse Spark…</> : 'Generate both drafts'}
        </button>
      </form>

      {state.status === 'error' && <p role='alert' className='rounded-lg border border-[rgba(255,77,109,.3)] bg-[rgba(255,77,109,.06)] p-3 text-[12px] text-risk-high'>{state.message}</p>}
      {state.status === 'done' && (
        <div className='space-y-3'>
          <DocumentCard title='Exchange freeze / preservation request' name='tracex-exchange-request.txt' text={state.documents.freezeRequest} />
          <DocumentCard title='Police incident-report draft' name='tracex-police-report.txt' text={state.documents.policeReport} />
          <p className='text-[10.5px] text-dim'>Generated by {state.documents.provider === 'meta' ? 'Muse Spark via Meta Model API' : state.documents.provider}. Check every claim and citation before sending.</p>
        </div>
      )}
    </div>
  );
}
