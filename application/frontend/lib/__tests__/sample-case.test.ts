import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { SAMPLE_CASE } from '../sample-case';
import { ruleBrief } from '../rule-brief';
import { layoutByHop } from '../layout';

describe('sample case integrity', () => {
  const ids = new Set(SAMPLE_CASE.nodes.map((n) => n.id));

  test('is clearly marked as synthetic', () => assert.equal(SAMPLE_CASE.sample, true));

  test('every transfer connects two known wallets with a well-formed tx hash', () => {
    for (const e of SAMPLE_CASE.edges) {
      assert.ok(ids.has(e.from) && ids.has(e.to), `dangling edge ${e.id}`);
      assert.match(e.txHash, /^0x[0-9a-f]{64}$/);
    }
  });

  test('every flag cites a transfer that exists in the case', () => {
    const hashes = new Set(SAMPLE_CASE.edges.map((e) => e.txHash));
    for (const risk of SAMPLE_CASE.risks) if (risk.tx) assert.ok(hashes.has(risk.tx), `${risk.type} cites unknown tx`);
  });
});

describe('rule-based brief (no AI)', () => {
  const brief = ruleBrief(SAMPLE_CASE);
  test('cites the transactions behind the flags', () => {
    for (const risk of SAMPLE_CASE.risks) if (risk.tx) assert.ok(brief.includes(risk.tx));
  });
  test('only suggests next steps that apply to this case', () => {
    assert.match(brief, /KYC records/); // there is an exchange in the sample
    assert.match(brief, /bridge/);
  });
});

describe('graph layout', () => {
  test('places each hop in its own column, centred vertically', () => {
    const pos = layoutByHop(SAMPLE_CASE.nodes);
    for (const n of SAMPLE_CASE.nodes) assert.equal(pos.get(n.id)!.x % 190, 0);
    const hop0 = SAMPLE_CASE.nodes.filter((n) => n.hop === 0);
    assert.equal(pos.get(hop0[0].id)!.y, 0);
  });
});
