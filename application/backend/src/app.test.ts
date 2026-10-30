import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from './app';

/**
 * Integration tests: the real Express app on a random port, called over HTTP.
 * No API keys are set, so nothing here reaches Alchemy, Modal or Meta - these cover
 * routing, validation, error codes, rate limiting, CORS and the no-key fallbacks.
 * Live end-to-end checks are in live.test.ts (opt-in).
 */

const KEYS = ['META_API_KEY', 'FIREWORKS_API_KEY', 'BASETEN_API_KEY', 'BASETEN_MODEL_ID', 'ALCHEMY_API_KEY', 'ETHERSCAN_API_KEY', 'ANALYSIS_ENGINE_URL'];

function serve(env: Record<string, string>) {
  const saved = new Map(Object.keys(env).map((k) => [k, process.env[k]]));
  Object.assign(process.env, env);
  const server: Server = createApp().listen(0);
  for (const [k, v] of saved) v === undefined ? delete process.env[k] : (process.env[k] = v);
  const { port } = server.address() as AddressInfo;
  const call = async (path: string, body?: unknown, headers: Record<string, string> = {}) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, headers: res.headers, json: (await res.json().catch(() => null)) as any };
  };
  return { server, call };
}

let api: ReturnType<typeof serve>;
before(() => {
  for (const k of KEYS) delete process.env[k];
  api = serve({});
});
after(() => api.server.close());

describe('health and metadata', () => {
  test('GET / reports the service', async () => {
    const r = await api.call('/');
    assert.equal(r.status, 200);
    assert.equal(r.json.service, 'tracex-backend');
  });

  test('GET /api/chains lists all seven supported chains in order', async () => {
    const r = await api.call('/api/chains');
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.map((c: any) => c.id), ['ethereum', 'base', 'bnb', 'arbitrum', 'optimism', 'polygon', 'robinhood']);
    assert.equal(r.json.find((c: any) => c.id === 'bnb').native, 'BNB');
  });
});

describe('POST /api/trace validation', () => {
  test('missing input is a 400', async () => {
    const r = await api.call('/api/trace', {});
    assert.equal(r.status, 400);
  });

  test('text that is not a hash, address or ENS name is a 400 with guidance', async () => {
    const r = await api.call('/api/trace', { input: 'hello' });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /transaction hash|wallet address|ENS/);
  });

  test('an unsupported chain is a 400 naming the supported ones', async () => {
    const r = await api.call('/api/trace', { input: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chain: 'solana' });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /ethereum, base, bnb/);
  });
});

describe('AI endpoints without provider keys', () => {
  test('/api/explain needs a graph', async () => {
    const r = await api.call('/api/explain', {});
    assert.equal(r.status, 400);
  });

  test('/api/explain rejects unknown providers', async () => {
    const r = await api.call('/api/explain', { graph: { nodes: [], edges: [] }, provider: 'gpt' });
    assert.equal(r.status, 400);
  });

  test('/api/explain fails loudly instead of returning placeholder text', async () => {
    const r = await api.call('/api/explain', { graph: { nodes: [], edges: [] }, heuristics: [] });
    assert.equal(r.status, 502);
    assert.match(r.json.error, /All AI providers failed/);
    assert.match(r.json.error, /META_API_KEY/);
  });

  test('/api/ask needs a question and a graph', async () => {
    const r = await api.call('/api/ask', { question: 'mixer?' });
    assert.equal(r.status, 400);
  });
});

describe('Poisoning Shield and Recovery Kit validation', () => {
  test('/api/shield rejects something that is not a wallet address', async () => {
    const r = await api.call('/api/shield', { address: 'vitalik' });
    assert.equal(r.status, 400);
  });

  test('/api/recovery-kit rejects an unsupported language with details', async () => {
    const r = await api.call('/api/recovery-kit', { input: '0x' + 'ab'.repeat(32), exchange: 'Binance', language: 'klingon' });
    assert.equal(r.status, 400);
    assert.ok(Array.isArray(r.json.details) && r.json.details.length > 0);
  });
});

describe('rate limiting and CORS', () => {
  test('the trace limit returns 429 once exceeded', async () => {
    const limited = serve({ TRACE_LIMIT_PER_HOUR: '2' });
    try {
      const codes = [];
      for (let i = 0; i < 3; i++) codes.push((await limited.call('/api/trace', { input: 'nope' })).status);
      assert.deepEqual(codes, [400, 400, 429]);
    } finally {
      limited.server.close();
    }
  });

  test('ALLOWED_ORIGINS only lets the listed frontend through', async () => {
    const locked = serve({ ALLOWED_ORIGINS: 'https://tracex.example' });
    try {
      const ok = await locked.call('/', undefined, { Origin: 'https://tracex.example' });
      const other = await locked.call('/', undefined, { Origin: 'https://evil.example' });
      assert.equal(ok.headers.get('access-control-allow-origin'), 'https://tracex.example');
      assert.equal(other.headers.get('access-control-allow-origin'), null);
    } finally {
      locked.server.close();
    }
  });
});
