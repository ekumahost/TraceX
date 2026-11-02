'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CircleCheck, ImageUp, Loader2, Search, TriangleAlert } from 'lucide-react';
import clsx from 'clsx';
import { CHAINS } from '@/lib/chains';
import { OFFLINE_PRESETS } from '@/lib/offline-cases';
import { readScreenshot, type ScreenshotCandidate } from '@/lib/api';
import { fileToDataUrl } from '@/lib/audio';

type ShotState =
  | { status: 'idle' }
  | { status: 'reading'; preview: string }
  | { status: 'done'; preview: string; candidates: ScreenshotCandidate[] }
  | { status: 'error'; message: string };

export function detectInput(v: string): 'tx' | 'wallet' | 'ens' | null {
  const s = v.trim();
  if (/^0x[a-fA-F0-9]{64}$/.test(s)) return 'tx';
  if (/^0x[a-fA-F0-9]{40}$/.test(s)) return 'wallet';
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/i.test(s)) return 'ens';
  return null;
}

const KIND_LABEL = { tx: 'Transaction', wallet: 'Wallet', ens: 'ENS name' } as const;

export function SearchConsole({ initial = '', initialChain = 'auto', compact = false, autoFocus = false }: { initial?: string; initialChain?: string; compact?: boolean; autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(initial === 'sample' ? '' : initial);
  const [chain, setChain] = useState(initialChain);
  const [error, setError] = useState('');
  const [shot, setShot] = useState<ShotState>({ status: 'idle' });
  const fileInput = useRef<HTMLInputElement>(null);
  const kind = detectInput(value);

  const go = (q: string, on = chain) => router.push(`/investigate?q=${encodeURIComponent(q)}${q !== 'sample' && on !== 'auto' ? `&chain=${on}` : ''}`);

  // Screenshot to trace: Muse Spark reads the hashes and addresses, the backend checks each on-chain
  const read = async (file: File) => {
    if (!file.type.startsWith('image/')) return setShot({ status: 'error', message: 'That file is not an image. Use a PNG, JPEG or WebP screenshot.' });
    if (file.size > 8 * 1024 * 1024) return setShot({ status: 'error', message: 'That screenshot is larger than 8 MB.' });
    setError('');
    const preview = await fileToDataUrl(file);
    setShot({ status: 'reading', preview });
    try {
      const { candidates } = await readScreenshot(preview);
      setShot({ status: 'done', preview, candidates });
    } catch (e: any) {
      setShot({ status: 'error', message: /(Failed to fetch|NetworkError|Load failed)/i.test(e.message) ? 'The TraceX backend isn’t reachable.' : e.message });
    }
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const file = [...e.clipboardData.files].find((f) => f.type.startsWith('image/'));
    if (file) { e.preventDefault(); read(file); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return go('sample');
    if (!kind) return setError('Paste a 0x transaction hash, a 0x wallet address, or an ENS name like vitalik.eth');
    go(value.trim());
  };

  return (
    <form onSubmit={submit} className='w-full'>
      <div className='console'>
        <div className={clsx('flex items-center gap-3', compact ? 'px-3 py-1.5' : 'p-2 pl-5')}>
          <Search className='h-[18px] w-[18px] flex-none text-dim' />
          <input
            value={value}
            autoFocus={autoFocus}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            onPaste={onPaste}
            placeholder={compact ? 'New trace: tx hash, wallet or ENS' : 'Paste a tx hash, wallet address or ENS name'}
            className={clsx('input min-w-0 flex-1', compact ? 'py-2 text-[13px]' : 'py-3')}
            spellCheck={false}
            aria-label='Transaction hash, wallet address or ENS name'
          />
          {kind && <span className='chip tone-low hidden sm:inline-flex'>{KIND_LABEL[kind]}</span>}
          {!compact && (
            <>
              <input ref={fileInput} type='file' accept='image/png,image/jpeg,image/webp,image/gif' className='hidden' onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) read(f); }} />
              <button
                type='button'
                onClick={() => fileInput.current?.click()}
                disabled={shot.status === 'reading'}
                title='Trace from a screenshot: an exchange withdrawal, wallet receipt or chat. You can also paste one into the box.'
                aria-label='Trace from a screenshot'
                className='flex-none rounded-md border border-line-2 bg-panel-2 p-2.5 text-muted hover:text-cream disabled:opacity-50'
              >
                {shot.status === 'reading' ? <Loader2 className='h-4 w-4 animate-spin' /> : <ImageUp className='h-4 w-4' />}
              </button>
            </>
          )}
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            aria-label='Chain'
            title='Transaction hashes are found on any supported chain automatically; wallets default to Ethereum'
            className={clsx(
              'flex-none cursor-pointer rounded-md border border-line-2 bg-panel-2 font-display font-semibold uppercase tracking-[.12em] text-muted outline-none hover:text-cream focus:border-[var(--line-v)]',
              compact ? 'px-2 py-1.5 text-[10px]' : 'hidden px-3 py-2.5 text-[11px] sm:block',
            )}
          >
            <option value='auto'>Auto chain</option>
            {CHAINS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type='submit' className={clsx('btn', compact && 'btn--sm')} aria-label={compact ? 'Trace' : 'Investigate'}>
            <span className={compact ? undefined : 'hidden sm:inline'}>{compact ? 'Trace' : 'Investigate'}</span> <ArrowRight />
          </button>
        </div>
      </div>
      {error && <p className='mt-3 text-[13px] text-risk-medium'>{error}</p>}
      {shot.status !== 'idle' && (
        <div className='mt-3 flex gap-3 rounded-lg border border-line bg-panel p-3 text-left' role='status'>
          {'preview' in shot && <img src={shot.preview} alt='Your screenshot' className='h-20 w-14 flex-none rounded border border-line object-cover object-top' />}
          <div className='min-w-0 flex-1 space-y-2'>
            {shot.status === 'reading' && <p className='text-[12.5px] text-muted'>Muse Spark is reading your screenshot, then TraceX checks each value on-chain…</p>}
            {shot.status === 'error' && <p className='text-[12.5px] text-risk-medium'>{shot.message}</p>}
            {shot.status === 'done' && !shot.candidates.length && <p className='text-[12.5px] text-muted'>No transaction hash, wallet address or ENS name found in this screenshot. Try a clearer or closer one.</p>}
            {shot.status === 'done' && shot.candidates.map((c) => (
              <div key={c.value} className='flex flex-wrap items-center gap-2'>
                <span className='chip !px-2 !py-0.5 !text-[9px]'>{c.label || KIND_LABEL[c.kind === 'address' ? 'wallet' : c.kind]}</span>
                <code className='min-w-0 truncate font-mono text-[12px] text-cream' title={c.value}>{c.value}</code>
                <span className={clsx('flex items-center gap-1 text-[11px]', c.verified ? 'text-risk-clean' : 'text-risk-medium')}>
                  {c.verified ? <CircleCheck className='h-3.5 w-3.5' /> : <TriangleAlert className='h-3.5 w-3.5' />}{c.note}
                </span>
                <button type='button' onClick={() => go(c.value, c.kind === 'tx' && c.chains[0] ? c.chains[0] : chain)} className='btn btn--sm !px-3 !py-1.5'>Trace <ArrowRight /></button>
              </div>
            ))}
            {shot.status === 'done' && !!shot.candidates.length && <p className='text-[10.5px] text-dim'>Read by Muse Spark (Meta Model API). Compare each value with your screenshot before you rely on it.</p>}
          </div>
        </div>
      )}
      {!compact && (
        <div className='mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-dim'>
          <span>Try:</span>
          <button type='button' onClick={() => go('sample')} className='text-gold hover:text-gold-soft'>
            Sample case: drained wallet → mixer → exchange
          </button>
          <span className='hidden h-3 w-px bg-white/10 sm:block' />
          <button type='button' onClick={() => setValue('vitalik.eth')} className='hover:text-cream'>vitalik.eth</button>
        </div>
      )}
      {!compact && <label className='mt-3 flex flex-wrap items-center gap-2 text-[12px] text-dim'>
        <span>Offline demo (no RPC):</span>
        <select
          value=''
          onChange={(event) => {
            if (event.target.value) go(`demo:${event.target.value}`);
          }}
          aria-label='Open an offline synthetic trace'
          className='cursor-pointer rounded-md border border-line-2 bg-panel-2 px-2.5 py-2 font-display text-[11px] font-semibold text-muted outline-none hover:text-cream focus:border-[var(--line-v)]'
        >
          <option value=''>Choose a synthetic case</option>
          {OFFLINE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.title}</option>)}
        </select>
      </label>}
    </form>
  );
}
