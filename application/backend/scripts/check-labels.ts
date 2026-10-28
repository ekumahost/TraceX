// Classifies every seed address on every chain - exchange EOAs should stay exchanges unless a
// contract lives at that address on a chain.   npx tsx scripts/check-labels.ts
import 'dotenv/config';
import { CHAINS, CHAIN_ORDER } from '../src/services/chains';
import { classify } from '../src/services/labels';

const probe = ['0x28c6c06298d514db089934071355e5743bf21d60', '0xf977814e90da44bfa03b6295a0616a897441acec', '0x4200000000000000000000000000000000000010', '0x0000000000000000000000000000000000000064'];
(async () => {
  for (const id of CHAIN_ORDER) {
    const out = await Promise.all(probe.map((a) => classify(CHAINS[id], a).then((e) => `${e.type}${e.label ? `:${e.label}` : ''}`).catch((e) => `ERR ${e.message}`)));
    console.log(CHAINS[id].name.padEnd(16), out.join(' | '));
  }
})();
