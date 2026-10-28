import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRecoveryDocuments, validateRecoveryCitations } from './recovery';

const hash = `0x${'a'.repeat(64)}`;
const address = `0x${'b'.repeat(40)}`;
const validDocument = `Observed transfer ${hash} from ${address}.`;

test('parses the two recovery documents from JSON or a fenced JSON response', () => {
  const json = JSON.stringify({ freezeRequest: validDocument, policeReport: validDocument });
  assert.deepEqual(parseRecoveryDocuments(json), { freezeRequest: validDocument, policeReport: validDocument });
  assert.deepEqual(parseRecoveryDocuments(`\`\`\`json\n${json}\n\`\`\``), { freezeRequest: validDocument, policeReport: validDocument });
});

test('rejects malformed or incomplete model responses', () => {
  assert.throws(() => parseRecoveryDocuments('not JSON'), /required recovery document format/);
  assert.throws(() => parseRecoveryDocuments('{"freezeRequest":"request"}'), /missing a recovery document/);
});

test('requires a case transaction and rejects invented transaction hashes', () => {
  const hashes = new Set([hash]);
  const addresses = new Set([address]);
  assert.doesNotThrow(() => validateRecoveryCitations(validDocument, hashes, addresses));
  assert.throws(() => validateRecoveryCitations(`No transaction listed ${address}`, hashes, addresses), /did not cite any transaction/);
  assert.throws(() => validateRecoveryCitations(`Transfer ${`0x${'c'.repeat(64)}`}`, hashes, addresses), /not in this case/);
});

test('requires every transaction from the case in each document', () => {
  const otherHash = `0x${'d'.repeat(64)}`;
  assert.throws(
    () => validateRecoveryCitations(validDocument, new Set([hash, otherHash]), new Set([address])),
    /did not cite every transaction/,
  );
  assert.doesNotThrow(() => validateRecoveryCitations(`${validDocument} Also reviewed ${otherHash}.`, new Set([hash, otherHash]), new Set([address])));
});

test('rejects wallet addresses not present in the case', () => {
  assert.throws(
    () => validateRecoveryCitations(`Transfer ${hash} to ${`0x${'c'.repeat(40)}`}`, new Set([hash]), new Set([address])),
    /address that is not in this case/,
  );
});
