const fs = require('fs');
const q = String.fromCharCode(34);
const pkg = {
  name: 'tracex-frontend',
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint'
  },
  dependencies: {
    next: '14.2.5',
    react: '^18',
    'react-dom': '^18',
    reactflow: '^11.11.3',
    'framer-motion': '^11.0.0',
    'tailwind-merge': '^2.2.1',
    clsx: '^2.1.0',
    'lucide-react': '^0.363.0',
    recharts: '^2.12.2',
    ethers: '^6.12.0'
  },
  devDependencies: {
    typescript: '^5',
    '@types/node': '^20',
    '@types/react': '^18',
    '@types/react-dom': '^18',
    tailwindcss: '^3.4.1',
    postcss: '^8',
    autoprefixer: '^10.0.1',
    eslint: '^8',
    'eslint-config-next': '14.2.5'
  }
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('package.json created');
