const fs = require('fs');
const pkg = {
  name: 'tracex-backend',
  version: '0.1.0',
  main: 'src/index.ts',
  scripts: {
    dev: 'tsx watch src/index.ts',
    build: 'tsc',
    start: 'node dist/index.js'
  },
  dependencies: {
    express: '^4.19.2',
    cors: '^2.8.5',
    dotenv: '^16.4.5',
    ethers: '^6.12.0',
    axios: '^1.6.8',
    zod: '^3.23.8'
  },
  devDependencies: {
    typescript: '^5.4.5',
    tsx: '^4.7.1',
    '@types/express': '^4.17.21',
    '@types/node': '^20',
    '@types/cors': '^2.8.17'
  }
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('backend package.json created');
