// Checks every token in chains.ts against the chain itself (symbol + decimals) and that each RPC answers.
//   npx tsx scripts/check-chains.ts
import { CHAINS, CHAIN_ORDER } from '../src/services/chains';
import { tokenInfo } from '../src/services/rpc';

(async () => {
  let bad = 0;
  for (const id of CHAIN_ORDER) {
    const chain = CHAINS[id];
    for (const [address, token] of Object.entries(chain.tokens)) {
      try {
        const info = await tokenInfo(chain, address);
        const ok = info.decimals === token.decimals && info.symbol.toUpperCase().replace(/[^A-Z.]/g, '').startsWith(token.symbol.replace('.E', '').toUpperCase().slice(0, 3));
        if (!ok) bad++;
        console.log(`${ok ? 'ok  ' : 'BAD '} ${chain.name.padEnd(10)} ${token.symbol.padEnd(7)} on-chain: ${info.symbol} / ${info.decimals}  expected decimals ${token.decimals}`);
      } catch (e: any) {
        bad++;
        console.log(`FAIL ${chain.name.padEnd(10)} ${token.symbol.padEnd(7)} ${e.shortMessage ?? e.message}`);
      }
    }
  }
  console.log(bad ? `${bad} problem(s)` : 'all tokens verified');
  process.exit(bad ? 1 : 0);
})();
