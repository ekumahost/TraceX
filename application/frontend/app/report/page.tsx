'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowLeft, Printer } from 'lucide-react';
import { Mark } from '@/components/Logo';
import { CasePreview } from '@/components/landing/CasePreview';
import { RichText } from '@/components/workspace/RichText';
import { loadReport, type ReportBundle } from '@/lib/report';
import { PROVIDER_LABEL } from '@/lib/api';
import { ruleBrief } from '@/lib/rule-brief';
import { caseStats, fmtDuration, fmtTime, fmtValue, RISK_TITLE, TYPE_LABEL, verdict } from '@/lib/format';
import { CHAINS } from '@/lib/chains';

const TONE = { high: '#d92d4b', medium: '#c47d00', low: '#0b7f8c', clean: '#13865c' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='mt-9 break-inside-avoid-page'>
      <h2 className='mb-3 border-b border-[#e3e1ee] pb-2 font-display text-[11px] font-bold uppercase tracking-[.2em] text-[#4b3fd6]'>{title}</h2>
      {children}
    </section>
  );
}

// Printable evidence report - "Save as PDF" uses the browser's print dialog, so text stays selectable
export default function ReportPage() {
  const [bundle, setBundle] = useState<ReportBundle | null | undefined>(undefined);
  useEffect(() => setBundle(loadReport()), []);

  if (bundle === undefined) return null;
  if (!bundle) {
    return (
      <main className='grid min-h-screen place-items-center p-6 text-center'>
        <div>
          <p className='text-muted'>No case to report yet. Open a case and choose Export → Report.</p>
          <Link href='/investigate?q=sample' className='btn mt-6'>Open the sample case</Link>
        </div>
      </main>
    );
  }

  const { data, score, brief } = bundle;
  const s = caseStats(data);
  const v = verdict(score);
  const graphNode = (id: string) => data.nodes.find((n) => n.id === id);
  const name = (id: string) => graphNode(id)?.label ?? graphNode(id)?.address ?? id;
  const explorer = (id?: string) => CHAINS.find((c) => c.id === id)?.explorer;
  const events = [...data.edges].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp));

  return (
    <div className='report-screen min-h-screen bg-ink py-8 print:bg-white print:py-0'>
      <div className='no-print mx-auto mb-6 flex max-w-[860px] items-center justify-between gap-3 px-4'>
        <button type='button' onClick={() => history.length > 1 ? history.back() : window.close()} className='btn btn--ghost btn--sm'><ArrowLeft /> Back</button>
        <span className='hidden text-[13px] text-dim sm:block'>In the print dialog, choose “Save as PDF”.</span>
        <button type='button' onClick={() => window.print()} className='btn btn--sm'><Printer /> Save as PDF</button>
      </div>

      <article className='paper mx-auto max-w-[860px] bg-white px-[clamp(20px,5vw,56px)] py-12 text-[13.5px] leading-relaxed text-[#1c1b26] shadow-2xl print:max-w-none print:px-0 print:py-0 print:shadow-none'>
        {/* header */}
        <header className='flex items-start justify-between gap-6 border-b-2 border-[#1c1b26] pb-6'>
          <div className='flex items-center gap-3'>
            <Mark className='h-11 w-11 text-[#1c1b26]' />
            <div>
              <div className='font-display text-[20px] font-extrabold uppercase tracking-tight'>TraceX <span className='font-serif font-normal normal-case italic text-[#b07a10]'>ai</span></div>
              <div className='font-display text-[10.5px] font-bold uppercase tracking-[.22em] text-[#6b6985]'>Investigation report</div>
            </div>
          </div>
          <div className='text-right text-[11.5px] text-[#55536b]'>
            <div>Generated {fmtTime(bundle.generatedAt)}</div>
            <div>{data.network}{data.source ? ` · data: ${data.source}` : ''}</div>
            {data.engine && <div>Detectors: {data.engine}</div>}
          </div>
        </header>

        {data.sample && (
          <p className='mt-5 rounded border border-[#e6c46a] bg-[#fff8e6] px-4 py-2.5 text-[12.5px] text-[#7a5600]'>
            <strong>Sample case.</strong> Synthetic data for demonstration - not a real investigation.
          </p>
        )}

        {/* summary */}
        <div className='mt-7 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center'>
          <div className='flex h-[118px] w-[118px] flex-col items-center justify-center rounded-full border-[6px]' style={{ borderColor: TONE[v.tone] }}>
            <div className='font-display text-[38px] font-extrabold leading-none'>{score}</div>
            <div className='mt-1 font-display text-[9.5px] font-bold uppercase tracking-[.18em]' style={{ color: TONE[v.tone] }}>{v.label}</div>
          </div>
          <div>
            <div className='font-display text-[10.5px] font-bold uppercase tracking-[.2em] text-[#6b6985]'>Case</div>
            <div className='mono mt-1 break-all text-[13px]'>{data.input}</div>
            <div className='mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4'>
              {[['Moved', fmtValue(s.moved, s.asset)], ['Span', s.span ? fmtDuration(s.span) : '-'], ['Wallets', s.wallets], ['Hops', s.hops]].map(([k, val]) => (
                <div key={k} className='rounded border border-[#e3e1ee] px-3 py-2'>
                  <div className='font-display text-[9.5px] font-bold uppercase tracking-[.18em] text-[#6b6985]'>{k}</div>
                  <div className='font-display text-[15px] font-bold'>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className='mt-3 text-[11px] text-[#55536b]'>Rule-based indicator for this trace, not a probability or proof of wrongdoing.</p>

        <Section title={`Findings · ${data.risks.length}`}>
          {data.risks.length ? (
            <table className='w-full border-collapse text-left text-[12.5px]'>
              <tbody>
                {data.risks.map((r, i) => (
                  <tr key={i} className='break-inside-avoid border-b border-[#efedf6] align-top'>
                    <td className='w-[90px] py-2.5 pr-3'>
                      <span className='rounded px-2 py-0.5 font-display text-[9.5px] font-bold uppercase tracking-[.14em] text-white' style={{ background: TONE[r.severity] }}>{r.severity}</span>
                    </td>
                    <td className='py-2.5'>
                      <div className='font-bold'>{r.title ?? RISK_TITLE[r.type] ?? r.type}</div>
                      <div className='text-[#3a3950]'>{r.detail}</div>
                      {r.tx && <div className='mono mt-1 break-all text-[10.5px] text-[#0b6e7a]'>Evidence: {r.tx}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className='text-[#3a3950]'>No suspicious patterns detected.</p>
          )}
        </Section>

        <Section title='Fund flow'>
          <div className='h-[340px] rounded border border-[#e3e1ee] p-3'>
            <CasePreview data={data} light />
          </div>
        </Section>

        <Section title={brief ? `AI brief · ${PROVIDER_LABEL[brief.provider].model} via ${PROVIDER_LABEL[brief.provider].via}` : 'Summary · rule-based (no AI)'}>
          <RichText text={brief?.text ?? ruleBrief(data)} data={data} onCite={() => {}} />
        </Section>

        <Section title={`Transfers · ${events.length}`}>
          <table className='w-full border-collapse text-left text-[11.5px]'>
            <thead>
              <tr className='border-b border-[#1c1b26] font-display text-[9.5px] uppercase tracking-[.16em] text-[#6b6985]'>
                <th className='py-2 pr-2'>Time (UTC)</th><th className='py-2 pr-2'>From → To</th><th className='py-2 pr-2 text-right'>Value</th><th className='py-2'>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className='break-inside-avoid border-b border-[#efedf6] align-top'>
                  <td className='whitespace-nowrap py-2 pr-2'>{fmtTime(e.timestamp).replace(' UTC', '')}</td>
                  <td className='py-2 pr-2'>
                    <div>{name(e.from) ?? <span className='mono'>{e.from}</span>}</div>
                    <div className='text-[#6b6985]'>→ {name(e.to) ?? <span className='mono'>{e.to}</span>}</div>
                  </td>
                  <td className='mono whitespace-nowrap py-2 pr-2 text-right'>{fmtValue(e.value, e.asset)}</td>
                  <td className='mono break-all py-2 text-[10px]'>
                    {explorer(e.chain ?? data.chain) ? <a href={`${explorer(e.chain ?? data.chain)}/tx/${e.txHash}`} className='text-[#0b6e7a]'>{e.txHash}</a> : e.txHash}
                    {e.destinationTxHash && (
                      <div className='mt-1 border-t border-[#efedf6] pt-1 text-[#6b6985]'>
                        {e.destinationChain} finalization:{' '}
                        {explorer(e.destinationChain) ? <a href={`${explorer(e.destinationChain)}/tx/${e.destinationTxHash}`} className='text-[#0b6e7a]'>{e.destinationTxHash}</a> : e.destinationTxHash}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title={`Wallets · ${data.nodes.length}`}>
          <table className='w-full border-collapse text-left text-[11.5px]'>
            <tbody>
              {[...data.nodes].sort((a, b) => a.hop - b.hop).map((n) => (
                <tr key={n.id} className='break-inside-avoid border-b border-[#efedf6]'>
                  <td className='w-[44px] py-1.5 text-[#6b6985]'>hop {n.hop}</td>
                  <td className='mono break-all py-1.5 pr-2 text-[10.5px]'>{n.address ?? n.id}</td>
                  <td className='py-1.5 pr-2'>{n.label ?? ''}</td>
                  <td className='py-1.5 pr-2 text-[#6b6985]'>{TYPE_LABEL[n.type]}</td>
                  <td className={clsx('py-1.5 text-right font-bold')} style={{ color: n.risk >= 70 ? TONE.high : n.risk >= 40 ? TONE.medium : '#6b6985' }}>{n.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <footer className='mt-10 border-t border-[#e3e1ee] pt-4 text-[10.5px] leading-relaxed text-[#6b6985]'>
          Findings come from deterministic detectors over on-chain data; each cites the transaction that supports it.
          {brief && ' The AI brief was generated from the same data and should be checked against the cited transactions.'}
          Verify each transaction using its chain-specific block explorer link. Generated by TraceX AI - built in Enugu for the Meta AI Developer Hackathon 2026.
        </footer>
      </article>
    </div>
  );
}
