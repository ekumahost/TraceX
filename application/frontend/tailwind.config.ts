import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        'panel-3': 'var(--panel-3)',
        cream: 'var(--cream)',
        muted: 'var(--muted)',
        dim: 'var(--dim)',
        violet: { DEFAULT: 'var(--violet)', hi: 'var(--violet-hi)' },
        cyan: 'var(--cyan)',
        gold: { DEFAULT: 'var(--gold)', soft: 'var(--gold-soft)' },
        clay: 'var(--clay)',
        risk: { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--cyan)', clean: 'var(--green)' },
      },
      borderColor: { line: 'var(--line)', 'line-2': 'var(--line-2)' },
      fontFamily: {
        display: ['var(--f-display)', 'system-ui', 'sans-serif'],
        serif: ['var(--f-serif)', 'Georgia', 'serif'],
        mono: ['var(--f-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
