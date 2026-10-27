import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tracex: { dark: '#0a0a0f', panel: '#12121a', accent: '#6d5bff', cyan: '#00e5ff' }
      }
    }
  },
  plugins: []
};
export default config;
