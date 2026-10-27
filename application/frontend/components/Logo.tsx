import { useId } from 'react';
import clsx from 'clsx';

/**
 * TraceX mark - a geometric Adinkra-style emblem.
 * Four arms form the X of a trace, gold notches mark the cardinal points, and the
 * centre diamond (the node under investigation) nods to Mate Masie - "what I hear, I keep".
 * Each shape is a separate `.piece` so the loader can assemble it piece by piece.
 */
export function Mark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox='0 0 100 100' className={className} aria-hidden='true'>
      <defs>
        <linearGradient id={`g${id}`} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor='#9a8dff' />
          <stop offset='1' stopColor='#00e5ff' />
        </linearGradient>
      </defs>
      <g fill='currentColor'>
        <path className='piece' d='M6 6h16l18 24-10 10L6 22z' />
        <path className='piece' d='M94 6H78L60 30l10 10 24-18z' />
        <path className='piece' d='M94 94H78L60 70l10-10 24 18z' />
        <path className='piece' d='M6 94h16l18-24-10-10L6 78z' />
      </g>
      <g fill={mono ? 'currentColor' : 'var(--gold)'}>
        <path className='piece' d='M42 6h16l-8 10z' />
        <path className='piece' d='M94 42v16l-10-8z' />
        <path className='piece' d='M42 94h16l-8-10z' />
        <path className='piece' d='M6 42v16l10-8z' />
      </g>
      <path
        className='piece'
        fill={mono ? 'currentColor' : `url(#g${id})`}
        fillRule='evenodd'
        d='M50 34l16 16-16 16-16-16zM50 43l-7 7 7 7 7-7z'
      />
    </svg>
  );
}

export function Wordmark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={clsx('inline-flex items-center gap-3', className)}>
      <Mark className={size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'} />
      <span className={clsx('display leading-none', size === 'sm' ? 'text-[17px]' : 'text-[21px]')}>
        Trace<span className='grad-text'>X</span>
        <span className='serif ml-1 text-gold normal-case' style={{ fontSize: '1em' }}>ai</span>
      </span>
    </span>
  );
}
