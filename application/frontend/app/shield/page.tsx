'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, CircleAlert, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Wordmark } from '@/components/Logo';
import { CHAINS } from '@/lib/chains';
import { scanWallet } from '@/lib/api';
import type { ShieldResult } from '@/lib/types';
import { fmtTime, short } from '@/lib/format';

type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; result: ShieldResult };

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const KIND_LABEL = {
  lookalike: 'Lookalike address',
  fake_token: 'Unverified token',
  zero_transfer: 'Zero-value transfer',
} as const;

export default function ShieldPage() {
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('ethereum');
  const [state, setState] = useState<ScanState>({ status: 'idle' });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const wallet = address.trim();
    if (!ADDRESS_RE.test(wallet)) {
      setState({ status: 'error', message: 'Enter a valid 0x wallet address (40 hexadecimal characters).' });
      return;
    }

    setState({ status: 'loading' });
    try {
      setState({ status: 'done', result: await scanWallet(wallet, chain) });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Wallet scan failed.' });
    }
  };

  const result = state.status === 'done' ? state.result : null;

  return (
    <main className='min-h-screen bg-ink px-4 pb-16 pt-5 sm:px-8 sm:pt-8'>
      <div className='mx-auto max-w-5xl'>
        <header className='flex items-center justify-between border-b border-line pb-5'>
          <Link href='/' aria-label='TraceX home'><Wordmark size='sm' /></Link>
          <Link href='/' className='btn btn--ghost btn--sm'><ArrowLeft /> Home</Link>
        </header>

        <div className='grid gap-10 py-12 md:grid-cols-[.9fr_1.1fr] md:gap-16 md:py-20'>
          <section>
            <span className='eyebrow eyebrow--gold'><ShieldCheck className='h-4 w-4' /> Wallet safety</span>
            <h1 className='display mt-6 text-[clamp(38px,6vw,68px)]'>Spot the copycat <span className='serif grad-text'>before you send.</span></h1>
            <p className='mt-5 max-w-[48ch] text-[15px] leading-relaxed text-muted'>
              Address poisoning plants lookalike wallets and fake tokens in transaction history, hoping you copy the wrong recipient. TraceX compares recent indexed transfers with verified counterparties and shows the on-chain records behind any match.
            </p>
            <div className='mt-8 rounded-lg border border-line bg-panel p-4 text-[13px] leading-relaxed text-muted'>
              <div className='flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[.14em] text-cream'>
                <CircleAlert className='h-4 w-4 text-gold' /> Read-only scan
              </div>
              <p className='mt-2'>TraceX never asks for a seed phrase, private key, or wallet connection. A flagged pattern is a warning to verify the full address, not proof of malicious intent.</p>
            </div>
          </section>

          <section className='self-start rounded-xl border border-line bg-panel p-5 sm:p-7'>
            <h2 className='display text-[17px]'>Scan a wallet</h2>
            <p className='mt-2 text-[13px] text-dim'>Choose the chain where this address has activity.</p>
            <form onSubmit={submit} className='mt-6 space-y-4'>
              <label className='block'>
                <span className='font-display text-[10px] font-bold uppercase tracking-[.16em] text-dim'>Wallet address</span>
                <input
                  value={address}
                  onChange={(event) => { setAddress(event.target.value); setState({ status: 'idle' }); }}
                  placeholder='0x…'
                  spellCheck={false}
                  autoComplete='off'
                  disabled={state.status === 'loading'}
                  aria-label='Wallet address to scan'
                  className='input mt-2 w-full rounded-lg border border-line-2 bg-panel-2 px-4 py-3 font-mono text-[13px]'
                />
              </label>
              <label className='block'>
                <span className='font-display text-[10px] font-bold uppercase tracking-[.16em] text-dim'>Chain</span>
                <select
                  value={chain}
                  onChange={(event) => { setChain(event.target.value); setState({ status: 'idle' }); }}
                  disabled={state.status === 'loading'}
                  aria-label='Chain to scan'
                  className='input mt-2 w-full rounded-lg border border-line-2 bg-panel-2 px-4 py-3 text-[13px]'
                >
                  {CHAINS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <button type='submit' disabled={state.status === 'loading'} className='btn w-full'>
                {state.status === 'loading' ? <><Loader2 className='animate-spin' /> Scanning indexed transfers…</> : <><ShieldCheck /> Check wallet</>}
              </button>
            </form>

            <div aria-live='polite' className='mt-5'>
              {state.status === 'error' && (
                <div role='alert' className='rounded-lg border border-[rgba(255,181,71,.3)] bg-[rgba(255,181,71,.06)] p-4 text-[13px] text-gold-soft'>
                  <TriangleAlert className='mr-2 inline h-4 w-4 align-[-3px]' />{state.message}
                </div>
              )}
              {state.status === 'loading' && (
                <p className='text-center text-[12px] text-dim'>Comparing recent transfers with verified counterparties…</p>
              )}
              {result && (
                <div className='space-y-5'>
                  <div className={`rounded-lg border p-4 ${result.findingCount ? 'border-[rgba(255,77,109,.3)] bg-[rgba(255,77,109,.06)]' : 'border-[rgba(46,230,166,.25)] bg-[rgba(46,230,166,.05)]'}`}>
                    <div className='flex items-center gap-2 font-display text-[12px] font-bold uppercase tracking-[.12em]'>
                      {result.findingCount ? <TriangleAlert className='h-4 w-4 text-risk-high' /> : <ShieldCheck className='h-4 w-4 text-risk-clean' />}
                      {result.findingCount ? `${result.findingCount} pattern${result.findingCount === 1 ? '' : 's'} flagged` : 'No matching patterns found'}
                    </div>
                    <p className='mt-2 text-[12.5px] leading-relaxed text-muted'>
                      Scanned {result.scanned.toLocaleString()} {result.source} transfer records and identified {result.counterparties.toLocaleString()} verified counterparties on {CHAINS.find((item) => item.id === result.chain)?.name ?? result.chain}.
                    </p>
                  </div>

                  {(result.truncated || result.findingsTruncated) && (
                    <div className='rounded-lg border border-[rgba(255,181,71,.3)] bg-[rgba(255,181,71,.06)] p-3.5 text-[12px] leading-relaxed text-gold-soft'>
                      {result.truncated && <>The provider returned more history than this scan can inspect (up to {result.scanLimitPerDirection.toLocaleString()} records in each direction). Older activity may be missing. </>}
                      {result.findingsTruncated && <>Showing the 60 most recent matches; {result.findingCount} were found.</>}
                    </div>
                  )}

                  <p className='text-[11.5px] leading-relaxed text-dim'>
                    This checks indexed history only; absence of a match is not a guarantee of safety. Always confirm the entire address before sending.
                  </p>

                  {!!result.findings.length && (
                    <div className='space-y-3'>
                      {result.findings.map((finding, index) => (
                        <article key={`${finding.tx}-${finding.imposter}-${index}`} className='rounded-lg border border-line bg-panel-2 p-4'>
                          <div className='flex flex-wrap items-center justify-between gap-2'>
                            <span className='chip tone-high'>{KIND_LABEL[finding.kind]}</span>
                            <time className='text-[11px] text-dim'>{fmtTime(finding.timestamp)}</time>
                          </div>
                          <p className='mt-3 text-[13px] leading-relaxed text-cream'>{finding.detail}</p>
                          <div className='mt-4 flex flex-wrap gap-2'>
                            <a className='chip hover:text-cyan' href={`${result.explorer}/address/${finding.imposter}`} target='_blank' rel='noreferrer'>
                              {finding.kind === 'fake_token' ? 'Token contract' : 'Lookalike'} · {short(finding.imposter)} <ArrowUpRight className='h-3 w-3' />
                            </a>
                            {finding.mimics && (
                              <a className='chip hover:text-cyan' href={`${result.explorer}/address/${finding.mimics}`} target='_blank' rel='noreferrer'>
                                Related address · {short(finding.mimics)} <ArrowUpRight className='h-3 w-3' />
                              </a>
                            )}
                            <a className='chip hover:text-cyan' href={`${result.explorer}/tx/${finding.tx}`} target='_blank' rel='noreferrer'>
                              View transaction · {short(finding.tx)} <ArrowUpRight className='h-3 w-3' />
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className='border-t border-line pt-5 text-[12px] text-dim'>
          <Link href='/investigate?q=sample' className='transition-colors hover:text-cream'>Need to follow funds through multiple wallets? Open a TraceX investigation →</Link>
        </footer>
      </div>
    </main>
  );
}
