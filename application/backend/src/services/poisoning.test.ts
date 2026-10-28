import assert from 'node:assert/strict';
import test from 'node:test';
import { looksAlike } from './poisoning';

const address = (prefix: string, suffix: string, middle = '0') =>
  `0x${prefix}${middle.padEnd(40 - prefix.length - suffix.length, middle)}${suffix}`;

test('does not classify an address as its own lookalike', () => {
  const wallet = address('abcd', '1234');
  assert.equal(looksAlike(wallet, wallet), false);
  assert.equal(looksAlike(wallet, wallet.toUpperCase()), false);
});

test('requires at least seven matching characters across the visible ends', () => {
  assert.equal(looksAlike(address('abc', 'xyz'), address('abc', 'xyz', '1')), false);
  assert.equal(looksAlike(address('abcd', 'xyz'), address('abcd', 'xyz', '1')), true);
});

test('ignores addresses without matching prefixes and suffixes', () => {
  assert.equal(looksAlike(address('abcd', '1234'), address('wxyz', '5678')), false);
});
