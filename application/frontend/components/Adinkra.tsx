/**
 * Adinkra symbols (Akan, Ghana) - simplified line drawings, in the same spirit as BoxLife.
 * Each TraceX step carries one, with its traditional meaning.
 */

export type AdinkraName = 'nkyinkyim' | 'nyansapo' | 'mateMasie' | 'eban' | 'sankofa' | 'hwehwemudua' | 'nsoromma';

export const ADINKRA: Record<AdinkraName, { name: string; meaning: string }> = {
  nkyinkyim: { name: 'Nkyinkyim', meaning: 'the twisting path - initiative and versatility' },
  nyansapo: { name: 'Nyansapo', meaning: 'the wisdom knot - ingenuity and intelligence' },
  mateMasie: { name: 'Mate Masie', meaning: '"what I hear, I keep" - wisdom and understanding' },
  eban: { name: 'Eban', meaning: 'the fence - safety and security' },
  sankofa: { name: 'Sankofa', meaning: '"go back and get it" - learning from the past' },
  hwehwemudua: { name: 'Hwehwemudua', meaning: 'the measuring stick - examination and quality' },
  nsoromma: { name: 'Nsoromma', meaning: 'child of the heavens - guardianship' },
};

const PATHS: Record<AdinkraName, React.ReactNode> = {
  nkyinkyim: (
    <path strokeWidth='5' strokeLinejoin='round' strokeLinecap='round' d='M20 4l24 10-24 10 24 10-24 10 24 10-12 5' />
  ),
  nyansapo: (
    <g strokeWidth='4'>
      <circle cx='32' cy='20' r='12' />
      <circle cx='32' cy='44' r='12' />
      <circle cx='20' cy='32' r='12' />
      <circle cx='44' cy='32' r='12' />
    </g>
  ),
  mateMasie: (
    <g strokeWidth='4' strokeLinecap='round'>
      <path d='M8 22a12 12 0 0 1 24 0v10H20A12 12 0 0 1 8 22z' />
      <path d='M56 22a12 12 0 0 0-24 0v10h12a12 12 0 0 0 12-10z' />
      <path d='M8 42a12 12 0 0 0 24 0V32H20A12 12 0 0 0 8 42z' />
      <path d='M56 42a12 12 0 0 1-24 0V32h12a12 12 0 0 1 12 10z' />
    </g>
  ),
  eban: (
    <g strokeWidth='4' strokeLinejoin='round'>
      <rect x='6' y='6' width='52' height='52' rx='3' />
      <rect x='20' y='20' width='24' height='24' />
      <path d='M32 6v14M32 44v14M6 32h14M44 32h14' />
    </g>
  ),
  sankofa: (
    <g strokeWidth='4' strokeLinecap='round' strokeLinejoin='round'>
      <path d='M32 58C14 46 8 34 10 24c2-9 12-13 18-7 2 2 3 5 4 8 1-3 2-6 4-8 6-6 16-2 18 7 2 10-4 22-22 34z' />
      <path d='M24 26c-4 0-5-5-2-6 2-1 4 1 3 3M40 26c4 0 5-5 2-6-2-1-4 1-3 3' />
      <path d='M32 30v14' />
    </g>
  ),
  hwehwemudua: (
    <g strokeWidth='4.5' strokeLinecap='round'>
      <path d='M32 6v52M6 32h52M24 6h16M24 58h16M6 24v16M58 24v16' />
    </g>
  ),
  nsoromma: (
    <g strokeWidth='4' strokeLinejoin='round'>
      <path d='M32 4l6 16 16-6-6 16 16 6-16 6 6 16-16-6-6 16-6-16-16 6 6-16-16-6 16-6-6-16 16 6z' />
      <circle cx='32' cy='32' r='6' />
    </g>
  ),
};

export function Adinkra({ name, className = 'adinkra' }: { name: AdinkraName; className?: string }) {
  return (
    <svg viewBox='0 0 64 64' fill='none' stroke='currentColor' className={className} aria-hidden='true'>
      {PATHS[name]}
    </svg>
  );
}
