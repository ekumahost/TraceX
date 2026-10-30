import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { caseScore, fmtValue, fmtDuration, short, verdict, riskTone } from '../format';
import { scoreRisks } from '../../../backend/src/services/heuristics';
import type { Risk } from '../types';

const r = (severity: Risk['severity']): Risk => ({ type: 'mixer', severity, detail: '' });

describe('caseScore', () => {
  test('no findings is a clean 0', () => assert.equal(caseScore([]), 0));
  test('the worst finding sets the floor', () => {
    assert.equal(caseScore([r('high')]), 70);
    assert.equal(caseScore([r('medium')]), 40);
    assert.equal(caseScore([r('low')]), 15);
  });
  test('further findings add a little and the score caps at 100', () => {
    assert.equal(caseScore([r('medium'), r('high')]), 78);
    assert.equal(caseScore(Array.from({ length: 6 }, () => r('high'))), 100);
  });
  test('matches the backend scoring exactly', () => {
    const sets: Risk[][] = [[], [r('low')], [r('high'), r('low')], [r('medium'), r('medium'), r('low')], Array.from({ length: 4 }, () => r('high'))];
    for (const set of sets) assert.equal(caseScore(set), scoreRisks(set as any));
  });
});

describe('verdict and tone', () => {
  test('thresholds', () => {
    assert.equal(verdict(70).label, 'High risk');
    assert.equal(verdict(40).label, 'Elevated');
    assert.equal(verdict(15).label, 'Low risk');
    assert.equal(verdict(0).label, 'No flags');
    assert.equal(riskTone(95), 'high');
    assert.equal(riskTone(0), 'clean');
  });
});

describe('formatting', () => {
  test('values and durations', () => {
    assert.equal(fmtValue(600, 'ETH'), '600 ETH');
    assert.equal(fmtValue(0.0415, 'ETH'), '0.042 ETH');
    assert.equal(fmtValue(1234.5, 'USDC'), '1,235 USDC');
    assert.equal(fmtDuration(38 * 60_000), '38 min');
    assert.equal(fmtDuration(312 * 60_000), '5h 12m');
  });
  test('short keeps both ends of a hash', () => {
    assert.equal(short('0x884f0d4879613761eede606dab244ef288b5e79e'), '0x884f…e79e');
  });
});
