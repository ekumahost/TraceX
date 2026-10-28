import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAINS } from './chains';
import {
  bridgeFinalizationMatches,
  bridgeTestInterfaces,
  blockAtOrBeforeTimestamp,
  collectBridgeInitiations,
  uniqueFinalization,
  type BridgeLog,
} from './bridges';

const L1_TOKEN = '0x1111111111111111111111111111111111111111';
const L2_TOKEN = '0x2222222222222222222222222222222222222222';
const SENDER = '0x3333333333333333333333333333333333333333';
const RECIPIENT = '0x4444444444444444444444444444444444444444';
const ZERO = '0x0000000000000000000000000000000000000000';

test('locates the last destination block at or before the source timestamp', async () => {
  const timestamps = [100, 102, 104, 106, 108, 110];
  const getTimestamp = async (block: number) => timestamps[block];
  assert.equal(await blockAtOrBeforeTimestamp(107, 5, getTimestamp), 3);
  assert.equal(await blockAtOrBeforeTimestamp(99, 5, getTimestamp), 0);
  assert.equal(await blockAtOrBeforeTimestamp(111, 5, getTimestamp), 5);
});

function encodedLog(iface: typeof bridgeTestInterfaces.op, event: string, address: string, values: unknown[]): BridgeLog {
  const fragment = iface.getEvent(event)!;
  const encoded = iface.encodeEventLog(fragment, values);
  return { address, topics: [...encoded.topics], data: encoded.data };
}

test('extracts Base Standard Bridge ERC20 initiation and matches its exact L2 finalization', () => {
  const source = encodedLog(
    bridgeTestInterfaces.op,
    'ERC20BridgeInitiated',
    '0x3154cf16ccdb4c6d922629664174b904d80f2c35',
    [L1_TOKEN, L2_TOKEN, SENDER, RECIPIENT, 123n, '0x1234'],
  );
  const [initiation] = collectBridgeInitiations(CHAINS.ethereum, [source]);
  assert.equal(initiation?.destinationChain, 'base');
  assert.equal(initiation?.sourceToken, L1_TOKEN);
  assert.equal(initiation?.destinationToken, L2_TOKEN);
  assert.equal(initiation?.amount, 123n);

  const destination = encodedLog(
    bridgeTestInterfaces.op,
    'ERC20BridgeFinalized',
    '0x4200000000000000000000000000000000000010',
    [L2_TOKEN, L1_TOKEN, SENDER, RECIPIENT, 123n, '0x1234'],
  );
  assert.equal(bridgeFinalizationMatches(initiation, destination), true);
  assert.equal(bridgeFinalizationMatches(initiation, { ...destination, address: '0x096760f208390250649e3e8763348e783aef5562' }), false);
  assert.equal(bridgeFinalizationMatches(initiation, { ...destination, data: '0x' }), false);
  assert.equal(
    bridgeFinalizationMatches(initiation, encodedLog(bridgeTestInterfaces.op, 'ERC20BridgeFinalized', destination.address, [L2_TOKEN, L1_TOKEN, SENDER, RECIPIENT, 124n, '0x1234'])),
    false,
  );
  assert.equal(uniqueFinalization(initiation, [destination]), destination);
  assert.equal(uniqueFinalization(initiation, [destination, destination]), null);
});

test('matches native OP Stack finalizations only for the same sender, recipient, amount, and extra data', () => {
  const initiationLog = encodedLog(
    bridgeTestInterfaces.op,
    'ETHBridgeInitiated',
    '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1',
    [SENDER, RECIPIENT, 9n, '0x'],
  );
  const [initiation] = collectBridgeInitiations(CHAINS.ethereum, [initiationLog]);
  assert.equal(initiation?.destinationChain, 'optimism');
  const finalLog = encodedLog(
    bridgeTestInterfaces.op,
    'ETHBridgeFinalized',
    '0x4200000000000000000000000000000000000010',
    [SENDER, RECIPIENT, 9n, '0x'],
  );
  assert.equal(bridgeFinalizationMatches(initiation, finalLog), true);
  assert.equal(
    bridgeFinalizationMatches(initiation, encodedLog(bridgeTestInterfaces.op, 'ETHBridgeFinalized', finalLog.address, [SENDER, ZERO, 9n, '0x'])),
    false,
  );
});

test('decodes Arbitrum gateway deposit sequence and matches the L2 gateway event', () => {
  const source = encodedLog(
    bridgeTestInterfaces.arbitrum,
    'DepositInitiated',
    '0xa3a7b6f88361f48403514059f1f16c8e78d60eec',
    [L1_TOKEN, SENDER, RECIPIENT, 77n, 123n],
  );
  const [initiation] = collectBridgeInitiations(CHAINS.ethereum, [source]);
  assert.equal(initiation?.destinationChain, 'arbitrum');
  assert.equal(initiation?.amount, 123n);

  const destination = encodedLog(
    bridgeTestInterfaces.arbitrum,
    'DepositFinalized',
    '0x09e9222e96e7b4ae2a407b98d48e330053351eee',
    [L1_TOKEN, SENDER, RECIPIENT, 123n],
  );
  assert.equal(bridgeFinalizationMatches(initiation, destination), true);
  assert.equal(
    bridgeFinalizationMatches(initiation, encodedLog(bridgeTestInterfaces.arbitrum, 'DepositFinalized', destination.address, [L1_TOKEN, SENDER, ZERO, 123n])),
    false,
  );
});

test('ignores bridge-like logs emitted by unconfigured L1 contracts', () => {
  const log = encodedLog(
    bridgeTestInterfaces.op,
    'ETHBridgeInitiated',
    '0x5555555555555555555555555555555555555555',
    [SENDER, RECIPIENT, 1n, '0x'],
  );
  assert.deepEqual(collectBridgeInitiations(CHAINS.ethereum, [log]), []);
});
