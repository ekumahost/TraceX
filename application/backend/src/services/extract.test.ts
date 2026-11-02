import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { checkImage, parseCandidates } from './extract';
import { checkWav } from './transcribe';
import { validateRecoveryCitations } from './recovery';

const TX = '0x08bf5ce46d97ec6299b7a4d1ba9b37591a66c97775186ffd30a1cd023d909b90';
const ADDR = '0x884f5e4cb3c3d7bd1db1cd30f58e2d6b4ebde79e';

describe('screenshot to trace', () => {
  test('keeps well-formed values, joins wrapped hex, drops misreads and duplicates', () => {
    const text = `Here you go: {"items":[
      {"kind":"tx","value":"${TX.slice(0, 40)}\\n${TX.slice(40)}","chain":"Ethereum","label":"TxID"},
      {"kind":"tx","value":"0x08bf5ce46d97ec6299b7a4d1ba9b86ffd30a1cd023d909b90"},
      {"kind":"address","value":"${ADDR}"},
      {"kind":"address","value":"${ADDR.toUpperCase().replace('0X', '0x')}"},
      {"kind":"ens","value":"Vitalik.ETH"}]}`;
    const c = parseCandidates(text);
    assert.deepEqual(c.map((x) => [x.kind, x.value]), [['tx', TX], ['address', ADDR], ['ens', 'vitalik.eth']]);
    assert.equal(c[0].label, 'TxID');
    assert.equal(c[0].chainShown, 'Ethereum');
  });

  test('an empty screenshot is fine; prose without JSON is an error', () => {
    assert.deepEqual(parseCandidates('{"items":[]}'), []);
    assert.throws(() => parseCandidates('I cannot see any hashes.'), /expected JSON/);
  });

  test('accepts image data URLs only', () => {
    assert.ok(checkImage('data:image/png;base64,iVBORw0KGgo='));
    assert.throws(() => checkImage('https://example.com/a.png'), /data URL/);
    assert.throws(() => checkImage('data:application/pdf;base64,JVBER'), /data URL/);
    assert.throws(() => checkImage(undefined), /image required/);
  });
});

describe('voice statement', () => {
  test('accepts WAV only', () => {
    const wav = Buffer.alloc(44);
    wav.write('RIFF', 0, 'ascii'); wav.write('WAVE', 8, 'ascii');
    assert.doesNotThrow(() => checkWav(wav));
    assert.throws(() => checkWav(Buffer.from('OggS'.padEnd(64, '\0'))), /WAV/);
    assert.throws(() => checkWav(undefined as any), /audio required/);
  });

  test('a wallet the victim named in their statement may appear in the drafts', () => {
    const text = `Transfer ${TX}. The scammer gave me ${ADDR}.`;
    const hashes = new Set([TX]);
    assert.throws(() => validateRecoveryCitations(text, hashes, new Set()), /not in this case/);
    assert.doesNotThrow(() => validateRecoveryCitations(text, hashes, new Set(), new Set([ADDR])));
  });
});
