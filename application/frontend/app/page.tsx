'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Wordmark, Mark } from '@/components/Logo';
import { Adinkra, ADINKRA, type AdinkraName } from '@/components/Adinkra';
import { SearchConsole } from '@/components/SearchConsole';
import { Loader } from '@/components/landing/Loader';
import { HeroNetwork } from '@/components/landing/HeroNetwork';
import { CasePreview } from '@/components/landing/CasePreview';
import { useCountUp, useReveal, useScrolled } from '@/lib/hooks';
import { SAMPLE_CASE } from '@/lib/sample-case';
import { caseScore, caseStats, short } from '@/lib/format';

const HACKATHON = 'https://cerebralvalley.ai/e/meta-ai-developer-hackathon';

const STEPS: { n: string; title: string; symbol: AdinkraName; copy: string }[] = [
  { n: '01', title: 'Trace', symbol: 'nkyinkyim', copy: 'Paste a tx hash, wallet or ENS name on any of six EVM chains. TraceX pulls real on-chain transfers and follows the money hop by hop - up to 20 deep, without walking in circles.' },
  { n: '02', title: 'Detect', symbol: 'nyansapo', copy: 'Deterministic heuristics flag mixers, peel chains, high-velocity hops, bridges and exchange cash-outs - and score the case 0 to 100.' },
  { n: '03', title: 'Explain', symbol: 'mateMasie', copy: 'Meta’s Muse Spark reads the graph and the flags and writes a plain-English brief, instructed to cite the transaction hash behind every claim.' },
  { n: '04', title: 'Prove', symbol: 'eban', copy: 'Click any citation to land on the transfer. Ask follow-up questions. Export the evidence bundle for your report, exchange or police filing.' },
];

const DETECTORS = [
  { title: 'Mixer interaction', tone: 'high', copy: 'Deposits into known mixing pools, and the fresh wallets that withdraw from them.' },
  { title: 'Peel chain', tone: 'medium', copy: 'A large balance passed wallet to wallet, shaving small amounts off at every step.' },
  { title: 'High velocity', tone: 'medium', copy: 'Funds that cross many hops in minutes - the signature of a drain being laundered.' },
  { title: 'Exchange cash-out', tone: 'medium', copy: 'Value arriving at exchange deposit addresses, where KYC records can unlock identity.' },
  { title: 'Exchange hopping', tone: 'medium', copy: 'Funds that leave one exchange and land at another - a classic way to break the trail.' },
  { title: 'Bridge exit', tone: 'low', copy: 'Funds leaving for another chain, so the trail can be picked up on the other side.' },
] as const;

function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const { ref, value } = useCountUp(end);
  return <span ref={ref}>{value}{suffix}</span>;
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const onLoaded = useCallback(() => setReady(true), []);
  const scrolled = useScrolled();
  const root = useReveal<HTMLDivElement>();

  return (
    <div ref={root} className={clsx(ready && 'is-ready')}>
      <Loader onDone={onLoaded} />

      {/* ---------------- header ---------------- */}
      <header className={clsx('site-header', scrolled && 'is-solid')}>
        <div className='wrap flex items-center justify-between gap-6'>
          <Link href='/' aria-label='TraceX home'><Wordmark /></Link>
          <nav className='hidden items-center gap-9 md:flex'>
            <a href='#method' className='nav-link'>Method</a>
            <a href='#case' className='nav-link'>Inside a case</a>
            <a href='#meta' className='nav-link'>Meta AI</a>
          </nav>
          <Link href='/investigate?q=sample' className='btn btn--sm'>Open a case <ArrowRight /></Link>
        </div>
      </header>

      <main>
        {/* ---------------- hero ---------------- */}
        <section className='relative flex min-h-[100svh] items-center overflow-hidden pb-24 pt-[calc(var(--header-h)+40px)]'>
          <HeroNetwork className='absolute inset-0 h-full w-full opacity-80' />
          <div className='pointer-events-none absolute inset-0' style={{ background: 'radial-gradient(ellipse 70% 60% at 30% 50%, rgba(7,7,13,.92) 0%, rgba(7,7,13,.55) 55%, rgba(7,7,13,.2) 100%)' }} />
          <Mark className='pointer-events-none absolute -right-[12vw] top-1/2 hidden w-[52vw] max-w-[760px] -translate-y-1/2 text-white opacity-[.06] lg:block' mono />

          <div className='wrap relative'>
            <div className='max-w-[900px]'>
              <span className={clsx('eyebrow eyebrow--gold transition-all duration-1000', ready ? 'opacity-100' : 'translate-y-4 opacity-0')}>
                Blockchain forensics · Built in Enugu
              </span>
              <h1 className='display lines mt-7 text-[clamp(48px,8.4vw,128px)]'>
                <span className='line'><span>Follow the</span></span>
                <span className='line'><span>money.</span></span>
                <span className='line'><span className='serif grad-text'>Prove it.</span></span>
              </h1>
              <p className={clsx('mt-8 max-w-[52ch] text-[clamp(16px,1.3vw,19px)] text-white/75 transition-all delay-300 duration-1000', ready ? 'opacity-100' : 'translate-y-6 opacity-0')}>
                AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into <em className='serif text-[1.15em] text-gold-soft'>evidence-backed</em> intelligence.
              </p>
              <div className={clsx('mt-10 max-w-[760px] transition-all delay-500 duration-1000', ready ? 'opacity-100' : 'translate-y-6 opacity-0')}>
                <SearchConsole />
              </div>
            </div>
          </div>

          <div className='wrap absolute inset-x-0 bottom-8 hidden items-end justify-between text-[12px] text-dim md:flex'>
            <span className='flex items-center gap-2'><span className='dot dot--live tone-clean' /> Ethereum · Base · BNB Chain · Arbitrum · Optimism · Polygon</span>
            <a href={HACKATHON} target='_blank' rel='noreferrer' className='flex items-center gap-1.5 hover:text-cream'>
              Built for the Meta AI Developer Hackathon 2026 <ArrowUpRight className='h-3.5 w-3.5' />
            </a>
          </div>
        </section>

        {/* ---------------- ticker ---------------- */}
        <div className='kente kente--thin' />
        <div className='ticker' aria-hidden='true'>
          <div className='ticker-track'>
            {[0, 1].map((k) => (
              <div key={k} className='flex items-center gap-10'>
                {(['nkyinkyim', 'nyansapo', 'mateMasie', 'eban', 'sankofa', 'hwehwemudua'] as AdinkraName[]).map((s, i) => (
                  <div key={s} className='flex items-center gap-10'>
                    <span className={i % 2 ? 'serif' : undefined}>{['Trace', 'detect', 'Explain', 'prove', 'Look back', 'measure'][i]}</span>
                    <Adinkra name={s} className='' />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className='kente kente--thin' />

        {/* ---------------- method ---------------- */}
        <section id='method' className='adire py-[clamp(100px,13vw,180px)]'>
          <div className='wrap'>
            <div className='mb-[clamp(48px,6vw,80px)] grid items-end gap-8 lg:grid-cols-[1.1fr_.9fr]'>
              <div>
                <span className='eyebrow reveal' data-reveal>The method</span>
                <h2 className='display reveal reveal-d1 mt-6 text-[clamp(34px,4.8vw,68px)]' data-reveal>
                  Four moves from <span className='serif text-gold'>suspicion</span> to evidence
                </h2>
              </div>
              <p className='reveal reveal-d2 max-w-[48ch] text-muted' data-reveal>
                Each step carries an Adinkra symbol - the visual proverbs of the Akan people of West Africa - because good investigation is old wisdom: follow the path, keep what you hear, build the fence.
              </p>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {STEPS.map((s, i) => (
                <article key={s.n} className={clsx('card card--hover reveal flex flex-col p-7', `reveal-d${i}`)} data-reveal>
                  <div className='flex items-start justify-between'>
                    <Adinkra name={s.symbol} />
                    <span className='font-display text-[13px] font-bold tracking-[.2em] text-dim'>{s.n}</span>
                  </div>
                  <h3 className='display mt-9 text-[28px]'>{s.title}</h3>
                  <p className='mt-3 flex-1 text-[14.5px] leading-relaxed text-muted'>{s.copy}</p>
                  <div className='mt-7 border-t border-line pt-5'>
                    <div className='adinkra-name'>{ADINKRA[s.symbol].name}</div>
                    <div className='adinkra-meaning mt-1.5'>{ADINKRA[s.symbol].meaning}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- inside a case ---------------- */}
        <section id='case' className='relative overflow-hidden border-y border-line bg-ink-2 py-[clamp(100px,12vw,160px)]'>
          <div className='dots pointer-events-none absolute inset-0 opacity-60' />
          <div className='wrap relative'>
            <div className='max-w-[760px]'>
              <span className='eyebrow eyebrow--violet reveal' data-reveal>Inside a case</span>
              <h2 className='display reveal reveal-d1 mt-6 text-[clamp(34px,4.8vw,68px)]' data-reveal>
                120 ETH drained. <span className='serif grad-text'>Thirty-eight minutes</span> later, it hit an exchange.
              </h2>
              <p className='reveal reveal-d2 mt-6 max-w-[56ch] text-muted' data-reveal>
                Our sample case follows a wallet drain through a mixing pool, a three-step peel chain and a bridge, right up to the cash-out. Every wallet, every flag, every claim - one click from its transaction.
              </p>
            </div>

            <div className='reveal mt-14 grid gap-4 lg:grid-cols-[1.5fr_1fr]' data-reveal>
              <div className='card relative h-[clamp(320px,42vw,520px)] overflow-hidden p-4'>
                <div className='absolute left-5 top-5 z-10 flex gap-2'>
                  <span className='chip tone-high'><span className='dot' /> Risk {caseScore(SAMPLE_CASE.risks)}</span>
                  <span className='chip'>{SAMPLE_CASE.nodes.length} wallets · {caseStats(SAMPLE_CASE).hops} hops</span>
                </div>
                <CasePreview />
              </div>
              <div className='card flex flex-col p-7'>
                <div className='flex items-center justify-between'>
                  <span className='eyebrow eyebrow--gold'>AI brief</span>
                  <span className='chip'>Muse Spark</span>
                </div>
                <p className='mt-6 font-serif text-[clamp(20px,1.8vw,25px)] italic leading-snug text-white/90'>
                  “The drainer split 120 ETH within nine minutes: 40 ETH into a mixing pool, the rest down a peel chain that ends at an exchange deposit address…”
                </p>
                <div className='mt-6 flex flex-wrap gap-2'>
                  {['drain', 'mix-in', 'cashout'].map((id) => (
                    <span key={id} className='cite'>{short(SAMPLE_CASE.edges.find((e) => e.id === id)!.txHash)}</span>
                  ))}
                </div>
                <p className='mt-auto pt-8 text-[13px] text-dim'>Illustrative excerpt. The live brief is generated from the case data when you open it.</p>
                <Link href='/investigate?q=sample' className='btn mt-6 self-start'>Open the sample case <ArrowRight /></Link>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- detectors ---------------- */}
        <section className='py-[clamp(100px,12vw,160px)]'>
          <div className='wrap grid gap-14 lg:grid-cols-[.8fr_1.2fr]'>
            <div className='lg:sticky lg:top-28 lg:self-start'>
              <span className='eyebrow reveal' data-reveal>Detectors</span>
              <h2 className='display reveal reveal-d1 mt-6 text-[clamp(34px,4.4vw,60px)]' data-reveal>
                The patterns <span className='serif text-gold'>launderers</span> can’t hide
              </h2>
              <p className='reveal reveal-d2 mt-6 max-w-[42ch] text-muted' data-reveal>
                Detection is deterministic code, not guesswork - so the AI only ever explains facts the engine can show you.
              </p>
              <div className='reveal reveal-d3 mt-10 flex items-center gap-4' data-reveal>
                <Adinkra name='hwehwemudua' className='h-11 w-11 text-gold' />
                <div>
                  <div className='adinkra-name'>{ADINKRA.hwehwemudua.name}</div>
                  <div className='adinkra-meaning'>{ADINKRA.hwehwemudua.meaning}</div>
                </div>
              </div>
            </div>
            <div className='divide-y divide-[var(--line)] border-y border-line'>
              {DETECTORS.map((d, i) => (
                <div key={d.title} className='reveal group grid grid-cols-[auto_1fr_auto] items-baseline gap-6 py-8' data-reveal>
                  <span className='font-display text-[13px] font-bold tracking-[.2em] text-dim'>0{i + 1}</span>
                  <div>
                    <h3 className='display text-[clamp(22px,2.2vw,30px)] transition-colors group-hover:text-gold'>{d.title}</h3>
                    <p className='mt-2 max-w-[52ch] text-[15px] text-muted'>{d.copy}</p>
                  </div>
                  <span className={clsx('chip', `tone-${d.tone}`)}>{d.tone}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Meta AI ---------------- */}
        <section id='meta' className='adire adire--strong relative overflow-hidden border-y border-line bg-ink-2 py-[clamp(100px,12vw,160px)]'>
          <div className='wrap'>
            <div className='mx-auto max-w-[920px] text-center'>
              <span className='eyebrow eyebrow--violet reveal' data-reveal>Powered by Meta AI</span>
              <blockquote className='reveal reveal-d1 mt-8 font-serif text-[clamp(30px,4vw,56px)] italic leading-[1.15]' data-reveal>
                “The model never gets to <span className='grad-text'>invent</span> a fact. It gets the graph, the flags, and one rule: <span className='text-gold'>cite the transaction.</span>”
              </blockquote>
            </div>

            <div className='mt-20 grid gap-px overflow-hidden rounded-xl border border-line bg-[var(--line)] md:grid-cols-5'>
              {[
                { k: 'On-chain data', v: '6 EVM chains · Alchemy · Etherscan' },
                { k: 'Fund-flow graph', v: 'BFS, loop-safe, 20 hops' },
                { k: 'Heuristics', v: 'Python · NetworkX on Modal' },
                { k: 'Explanation', v: 'Muse Spark · Meta Model API', hi: true },
                { k: 'Fallback', v: 'Llama 3.3 70B · Fireworks / Baseten' },
              ].map((s, i) => (
                <div key={s.k} className={clsx('reveal relative bg-panel p-6', `reveal-d${Math.min(i, 3)}`)} data-reveal>
                  <span className='font-display text-[12px] font-bold tracking-[.2em] text-dim'>0{i + 1}</span>
                  <div className={clsx('display mt-6 text-[17px]', s.hi && 'grad-text')}>{s.k}</div>
                  <div className='mt-2 text-[13.5px] text-muted'>{s.v}</div>
                  {s.hi && <span className='absolute right-5 top-5 dot dot--live tone-low' />}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- numbers ---------------- */}
        <section className='py-[clamp(90px,10vw,140px)]'>
          <div className='wrap grid gap-12 sm:grid-cols-2 lg:grid-cols-4'>
            {[
              { end: 6, label: 'EVM chains', note: 'Ethereum, Base, BNB, Arbitrum, Optimism, Polygon' },
              { end: 20, label: 'hops deep', note: 'breadth-first, never in circles' },
              { end: 6, label: 'detectors', note: 'deterministic, run on Modal' },
              { end: 3, label: 'Meta model paths', note: 'Meta Model API, Fireworks, Baseten' },
            ].map((s, i) => (
              <div key={s.label} className={clsx('reveal border-t border-line pt-8', `reveal-d${i}`)} data-reveal>
                <div className='display text-[clamp(64px,8vw,112px)] text-cream'><Counter end={s.end} /></div>
                <div className='mt-3 font-serif text-[22px] italic text-gold'>{s.label}</div>
                <div className='mt-1 text-[14px] text-dim'>{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------- CTA ---------------- */}
        <section className='relative overflow-hidden border-t border-line py-[clamp(100px,12vw,170px)]'>
          <Mark className='pointer-events-none absolute left-1/2 top-1/2 w-[640px] -translate-x-1/2 -translate-y-1/2 text-white opacity-[.04]' mono />
          <div className='wrap relative text-center'>
            <span className='eyebrow eyebrow--gold reveal' data-reveal>Start an investigation</span>
            <h2 className='display reveal reveal-d1 mx-auto mt-6 max-w-[16ch] text-[clamp(40px,6vw,92px)]' data-reveal>
              Every trail <span className='serif grad-text'>ends</span> somewhere.
            </h2>
            <div className='reveal reveal-d2 mx-auto mt-12 max-w-[720px] text-left' data-reveal>
              <SearchConsole />
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- footer ---------------- */}
      <div className='kente' />
      <footer className='bg-ink-2 py-14'>
        <div className='wrap flex flex-col gap-10 md:flex-row md:items-end md:justify-between'>
          <div>
            <Wordmark />
            <p className='mt-5 max-w-[46ch] text-[14px] text-muted'>
              AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence.
            </p>
          </div>
          <div className='text-[13px] text-dim md:text-right'>
            <p>Built by <span className='text-cream'>Okokoh Benjamin</span> · Enugu</p>
            <a href={HACKATHON} target='_blank' rel='noreferrer' className='mt-1 inline-flex items-center gap-1 hover:text-cream'>
              Meta AI Developer Hackathon 2026 <ArrowUpRight className='h-3.5 w-3.5' />
            </a>
            <p className='mt-1'>Adinkra symbols: visual proverbs of the Akan people, Ghana.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
