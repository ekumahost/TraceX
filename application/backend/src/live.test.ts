import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import 'dotenv/config';
import { traceCase } from './services/trace';
import { shieldWallet } from './services/poisoning';

/**
 * Live end-to-end tests against real chains, Alchemy and the deployed Modal engine.
 * Opt-in because they need keys and network:   LIVE=1 npm run test:live
 * The cases are real and documented in docs/demo-cases.md.
 */

const live = process.env.LIVE === '1' && !!process.env.ALCHEMY_API_KEY;
const opts = { skip: live ? false : 'set LIVE=1 and ALCHEMY_API_KEY to run live tests', timeout: 180_000 };

describe('live: real cases on mainnet', () => {
  test('600 ETH funding into Tornado Cash is traced, grouped and scored high', opts, async () => {
    const t = await traceCase('0x08bf5ce46d97ec6299b7a4d1ba9b37591a66c97775186ffd30a1cd023d909b90', 4);
    assert.equal(t.chain.id, 'ethereum');
    const intoMixer = t.edges.filter((e) => t.nodes.find((n) => n.id === e.to)?.type === 'mixer');
    assert.equal(intoMixer.reduce((s, e) => s + e.value, 0), 600);
    const mixer = t.risks.find((r) => r.type === 'mixer');
    assert.ok(mixer && mixer.severity === 'high' && mixer.count === 6);
    assert.ok(t.score >= 70);
  });

  test('the fake "ETH" token sent in the same attack is refused', opts, async () => {
    await assert.rejects(
      traceCase('0x9277e51fcff1fa173d73b3d9fc1f6d68a12f9a84b6d40067c538d11789010412', 2),
      /none of the assets TraceX follows/,
    );
  });

  test('Poisoning Shield finds both look-alike senders and the fake token', opts, async () => {
    const r = await shieldWallet('0x884f0d4879613761eede606dab244ef288b5e79e', 'ethereum');
    assert.ok(r.imposters.includes('0x241e9424af46a28458c7afbcb278ebd18591db8e'));
    assert.ok(r.imposters.includes('0x241b2234ed091c9a41e860a162003d94df66db8e'));
    assert.ok(r.findings.some((f) => f.kind === 'fake_token'));
  });

  test('a Robinhood Chain tx hash is found without being told the chain', opts, async () => {
    const t = await traceCase('0xd9e1e3e38b204992a2712e8611b683afb67b40025894ff30049d2617c3a97e0f', 2);
    assert.equal(t.chain.id, 'robinhood');
  });
});
