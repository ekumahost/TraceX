'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Check, Download, Info, Loader2 } from 'lucide-react';
import type { TraceCase } from '@/lib/types';
import { explainCase, fetchTrace } from '@/lib/api';
import { SAMPLE_CASE } from '@/lib/sample-case';
import { caseScore, short } from '@/lib/format';
import { Wordmark, Mark } from '../Logo';
import { SearchConsole } from '../SearchConsole';
import { TraceGraph, type Selection } from './TraceGraph';
import { CaseSummary } from './CaseSummary';
import { AIBrief, type BriefState } from './AIBrief';
import { ChatPanel } from './ChatPanel';
import { EvidencePanel } from './EvidencePanel';
import { Timeline } from './Timeline';

type Tab = 'brief' | 'ask' | 'evidence' | 'timeline';
const TABS: { id: Tab; label: string }[] = [
  { id: 'brief', label: 'AI brief' },
  { id: 'ask', label: 'Ask' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'timeline', label: 'Timeline' },
];

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Workspace({ query }: { query: string }) {
  const isSample = !query || query === 'sample';
  const [stage, setStage] = useState(0); // 0 fetch · 1 graph · 2 heuristics · 3 ready
  const [data, setData] = useState<TraceCase | null>(null);
  const [failReason, setFailReason] = useState<string | null>(null); // live trace failed, showing sample
  const [revealHop, setRevealHop] = useState(-1);
  const [selection, setSelection] = useState<Selection>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const [tab, setTab] = useState<Tab>('brief');
  const [brief, setBrief] = useState<BriefState>({ status: 'loading' });
  const run = useRef(0);

  // load the case: live trace when the backend has one, otherwise the labelled sample
  useEffect(() => {
    const id = ++run.current;
    setStage(0); setData(null); setRevealHop(-1); setSelection(null); setFailReason(null); setTab('brief');
    (async () => {
      const [live] = await Promise.all([isSample ? null : fetchTrace(query), wait(isSample ? 700 : 900)]);
      if (id !== run.current) return;
      const c = live && 'data' in live ? live.data : SAMPLE_CASE;
      setFailReason(live && 'error' in live ? live.error : null);
      setStage(1); await wait(550);
      if (id !== run.current) return;
      setStage(2); await wait(550);
      if (id !== run.current) return;
      setData(c); setStage(3);
    })();
  }, [query, isSample]);

  // grow the graph hop by hop
  useEffect(() => {
    if (!data) return;
    const max = Math.max(...data.nodes.map((n) => n.hop));
    let h = -1;
    const t = setInterval(() => {
      h += 1; setRevealHop(h);
      if (h >= max) clearInterval(t);
    }, 380);
    return () => clearInterval(t);
  }, [data]);

  const explain = useCallback(async (c: TraceCase) => {
    setBrief({ status: 'loading' });
    try {
      setBrief({ status: 'done', answer: await explainCase(c) });
    } catch (e: any) {
      setBrief({ status: 'error', error: e.message });
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    if (data.edges.length) explain(data);
    else setBrief({ status: 'error', error: 'No outgoing transfers were found from this starting point, so there is nothing to explain yet.' });
  }, [data, explain]);

  const select = useCallback((s: Selection) => { setSelection(s); if (s) setTab('evidence'); }, []);
  const cite = useCallback((s: Selection) => { setSelection(s); setFocusNonce((n) => n + 1); }, []);

  const exportCase = () => {
    if (!data) return;
    const bundle = {
      generatedBy: 'TraceX AI',
      generatedAt: new Date().toISOString(),
      sampleData: !!data.sample,
      query,
      score: caseScore(data.risks),
      case: data,
      aiBrief: brief.status === 'done' ? brief.answer : null,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `tracex-case-${short(data.input, 8, 0).replace('…', '')}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [isSample ? 'Loading sample case' : 'Fetching on-chain transfers', 'Building fund-flow graph', 'Running heuristics'];

  return (
    <div className='flex h-[100dvh] flex-col bg-ink'>
      {/* top bar */}
      <header className='flex h-16 flex-none items-center gap-4 border-b border-line px-4 sm:px-5'>
        <Link href='/' aria-label='TraceX home' className='flex-none'><Wordmark size='sm' /></Link>
        <div className='mx-auto hidden w-full max-w-[560px] md:block'><SearchConsole compact initial={query} /></div>
        <div className='ml-auto flex flex-none items-center gap-2 md:ml-0'>
          <span className='chip hidden lg:inline-flex'><span className='dot dot--live tone-clean' /> {data?.network ?? 'Ethereum'}</span>
          <button type='button' onClick={exportCase} disabled={!data} className='btn btn--ghost btn--sm'><Download /> <span className='hidden sm:inline'>Export</span></button>
        </div>
      </header>

      {data?.sample && (
        <div className='flex flex-none items-center gap-3 border-b border-[rgba(240,180,76,.25)] bg-[rgba(240,180,76,.07)] px-5 py-2 text-[12.5px] text-gold-soft'>
          <Info className='h-4 w-4 flex-none' />
          <span>
            <strong className='font-display text-[11px] uppercase tracking-[.16em] text-gold'>Sample case</strong> · synthetic data for demonstration.
            {failReason && <> The live trace for <span className='mono'>{short(query, 10, 6)}</span> failed: {failReason}.</>}
          </span>
        </div>
      )}

      <div className='flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[300px_1fr_420px] lg:overflow-hidden'>
        {/* left: case summary */}
        <aside className='scroll-thin order-2 border-line lg:order-none lg:overflow-y-auto lg:border-r'>
          {data ? <CaseSummary data={data} onSelect={(s) => { cite(s); setTab('evidence'); }} /> : <div className='space-y-4 p-5'>{[168, 80, 60, 60, 60].map((h, i) => <div key={i} className='shimmer' style={{ height: h }} />)}</div>}
        </aside>

        {/* centre: graph */}
        <section className='relative order-1 h-[62svh] flex-none border-b border-line lg:order-none lg:h-auto lg:border-b-0'>
          {data && <TraceGraph data={data} revealHop={revealHop} selection={selection} focusNonce={focusNonce} onSelect={select} />}
          {stage < 3 && (
            <div className='dots absolute inset-0 grid place-items-center'>
              <div className='w-[290px] text-center'>
                <Mark className='loader-mark mx-auto !h-16 !w-16' />
                <p className='mt-5 font-serif text-[20px] italic text-violet-hi'>Following the money…</p>
                {!isSample && stage === 0 && <p className='mt-2 text-[12.5px] text-dim'>Live traces can take up to a minute on the free data tier.</p>}
                <ul className='mt-6 space-y-2.5 text-left'>
                  {steps.map((s, i) => (
                    <li key={s} className={clsx('flex items-center gap-3 text-[13.5px] transition-colors', i < stage ? 'text-cream' : i === stage ? 'text-cream' : 'text-dim')}>
                      {i < stage ? <Check className='h-4 w-4 text-risk-clean' /> : i === stage ? <Loader2 className='h-4 w-4 animate-spin text-cyan' /> : <span className='h-4 w-4 rounded-full border border-line-2' />}
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {data && (
            <div className='pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2'>
              <span className='chip bg-[rgba(7,7,13,.8)]'>Case <span className='mono normal-case tracking-normal text-cream'>{short(data.input, 8, 6)}</span></span>
              {data.source && <span className='chip bg-[rgba(7,7,13,.8)]'>Data · {data.source}</span>}
              {!!data.incomplete?.length && <span className='chip tone-medium bg-[rgba(7,7,13,.8)]'>{data.incomplete.length} wallet{data.incomplete.length > 1 ? 's' : ''} not loaded</span>}
            </div>
          )}
          {data && !data.edges.length && (
            <div className='pointer-events-none absolute inset-x-0 bottom-16 text-center text-[13.5px] text-muted'>
              No outgoing transfers of ETH, USDT, USDC, DAI or WETH found from this starting point.
            </div>
          )}
        </section>

        {/* right: brief / ask / evidence / timeline */}
        <aside className='order-3 flex min-h-[70svh] flex-col border-line lg:order-none lg:min-h-0 lg:border-l'>
          <div role='tablist' className='flex flex-none gap-6 border-b border-line px-5'>
            {TABS.map((t) => (
              <button key={t.id} role='tab' aria-selected={tab === t.id} onClick={() => setTab(t.id)} className='tab'>{t.label}</button>
            ))}
          </div>
          <div className='scroll-thin min-h-0 flex-1 overflow-y-auto'>
            {!data ? (
              <div className='space-y-3 p-5'>{[90, 100, 70].map((w, i) => <div key={i} className='shimmer h-3' style={{ width: `${w}%` }} />)}</div>
            ) : tab === 'brief' ? (
              <AIBrief data={data} state={brief} onRetry={() => explain(data)} onCite={cite} />
            ) : tab === 'ask' ? (
              <ChatPanel data={data} onCite={cite} />
            ) : tab === 'evidence' ? (
              <EvidencePanel data={data} selection={selection} onSelect={cite} />
            ) : (
              <Timeline data={data} selection={selection} onSelect={cite} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
