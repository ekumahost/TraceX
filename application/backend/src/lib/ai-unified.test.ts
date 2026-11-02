import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import { providerOrder, runWithFallback } from './ai-unified';

const KEYS = ['META_API_KEY', 'FIREWORKS_API_KEY', 'BASETEN_API_KEY', 'AI_PROVIDER'];
const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
const setKeys = (env: Record<string, string>) => { for (const k of KEYS) delete process.env[k]; Object.assign(process.env, env); };
afterEach(() => { for (const k of KEYS) saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k]); });

describe('AI provider switching', () => {
  test('the chosen provider goes first, then the others', () => {
    setKeys({ META_API_KEY: 'x', FIREWORKS_API_KEY: 'x', BASETEN_API_KEY: 'x' });
    assert.deepEqual(providerOrder('baseten'), ['baseten', 'meta', 'fireworks']);
    assert.deepEqual(providerOrder(), ['meta', 'fireworks', 'baseten']);
  });

  test('providers without a key are tried last', () => {
    setKeys({ FIREWORKS_API_KEY: 'x' });
    assert.deepEqual(providerOrder('meta'), ['fireworks', 'meta', 'baseten']);
  });

  test('AI_PROVIDER sets the default', () => {
    setKeys({ META_API_KEY: 'x', FIREWORKS_API_KEY: 'x', AI_PROVIDER: 'fireworks' });
    assert.equal(providerOrder()[0], 'fireworks');
  });

  test('falls back to the next provider and reports what failed', async () => {
    setKeys({ META_API_KEY: 'x', FIREWORKS_API_KEY: 'x', BASETEN_API_KEY: 'x' });
    const a = await runWithFallback('meta', async (p) => {
      if (p === 'meta') throw new Error('503 overloaded');
      return `answer from ${p}`;
    });
    assert.equal(a.provider, 'fireworks');
    assert.equal(a.text, 'answer from fireworks');
    assert.deepEqual(a.fellBackFrom, [{ provider: 'meta', error: '503 overloaded' }]);
  });

  test('an empty answer counts as a failure, and all failures throw', async () => {
    setKeys({ META_API_KEY: 'x' });
    await assert.rejects(runWithFallback(undefined, async () => '  '), /All AI providers failed - meta: empty response/);
  });
});
