'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search } from 'lucide-react';
import clsx from 'clsx';
import { CHAINS } from '@/lib/chains';

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
  const kind = detectInput(value);

  const go = (q: string) => router.push(`/investigate?q=${encodeURIComponent(q)}${q !== 'sample' && chain !== 'auto' ? `&chain=${chain}` : ''}`);

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
            placeholder={compact ? 'New trace: tx hash, wallet or ENS' : 'Paste a tx hash, wallet address or ENS name'}
            className={clsx('input min-w-0 flex-1', compact ? 'py-2 text-[13px]' : 'py-3')}
            spellCheck={false}
            aria-label='Transaction hash, wallet address or ENS name'
          />
          {kind && <span className='chip tone-low hidden sm:inline-flex'>{KIND_LABEL[kind]}</span>}
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
    </form>
  );
}
