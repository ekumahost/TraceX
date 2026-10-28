import { formatUnits, Interface, ZeroAddress, type Log } from 'ethers';
import type { Chain, ChainId } from './chains';
import { CHAINS } from './chains';
import { getProvider } from './rpc';

const OP_BRIDGE = '0x4200000000000000000000000000000000000010';
const ARBITRUM_L2_GATEWAYS = [
  '0x09e9222e96e7b4ae2a407b98d48e330053351eee',
  '0x096760f208390250649e3e8763348e783aef5562',
  '0x6c411ad3e74de3e7bd422b94a27770f5b86c623b',
];
const ARBITRUM_GATEWAY_PAIRS: Record<string, string> = {
  '0xa3a7b6f88361f48403514059f1f16c8e78d60eec': ARBITRUM_L2_GATEWAYS[0],
  '0xcee284f754e854890e311e3280b767f80797180d': ARBITRUM_L2_GATEWAYS[1],
  '0xd92023e9d9911199a6711321d1277285e6d4e2db': ARBITRUM_L2_GATEWAYS[2],
};
const OP_ABI = [
  'event ETHBridgeInitiated(address indexed from,address indexed to,uint256 amount,bytes extraData)',
  'event ERC20BridgeInitiated(address indexed localToken,address indexed remoteToken,address indexed from,address to,uint256 amount,bytes extraData)',
  'event ETHBridgeFinalized(address indexed from,address indexed to,uint256 amount,bytes extraData)',
  'event ERC20BridgeFinalized(address indexed localToken,address indexed remoteToken,address indexed from,address to,uint256 amount,bytes extraData)',
];
const ARBITRUM_ABI = [
  'event DepositInitiated(address l1Token,address indexed from,address indexed to,uint256 indexed sequenceNumber,uint256 amount)',
  'event DepositFinalized(address indexed l1Token,address indexed from,address indexed to,uint256 amount)',
];
const op = new Interface(OP_ABI);
const arbitrum = new Interface(ARBITRUM_ABI);
const LOG_RANGE = 10_000;
const MAX_LOOKAHEAD_BLOCKS = 100_000;

export interface BridgeContinuation {
  sourceChain: ChainId;
  destinationChain: ChainId;
  sourceTxHash: string;
  destinationTxHash: string;
  sender: string;
  recipient: string;
  asset: string;
  value: number;
  timestamp: number;
  destinationBlock: number;
  bridge: string;
}

export interface Initiation {
  protocol: 'op' | 'arbitrum';
  sourceBridge: string;
  destinationBridge: string;
  sourceToken: string;
  destinationToken?: string;
  sender: string;
  recipient: string;
  amount: bigint;
  extraData?: string;
  destinationChain: ChainId;
}

export type BridgeLog = Pick<Log, 'address' | 'topics' | 'data'>;

const address = (value: string) => value.toLowerCase();
const topicAddress = (value: string) => `0x${value.slice(2).padStart(64, '0')}`.toLowerCase();

function opInitiations(chain: Chain, logs: readonly BridgeLog[]): Initiation[] {
  if (chain.id !== 'ethereum') return [];
  const targets: Record<string, ChainId> = {
    '0x3154cf16ccdb4c6d922629664174b904d80f2c35': 'base',
    '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1': 'optimism',
  };
  const found: Initiation[] = [];
  for (const log of logs) {
    const destinationChain = targets[address(log.address)];
    if (!destinationChain) continue;
    let parsed;
    try { parsed = op.parseLog(log); } catch { continue; }
    if (parsed?.name === 'ETHBridgeInitiated') {
      found.push({
        protocol: 'op',
        sourceBridge: address(log.address),
        destinationBridge: OP_BRIDGE,
        sourceToken: ZeroAddress,
        sender: address(parsed.args.from),
        recipient: address(parsed.args.to),
        amount: parsed.args.amount,
        extraData: parsed.args.extraData,
        destinationChain,
      });
    } else if (parsed?.name === 'ERC20BridgeInitiated') {
      found.push({
        protocol: 'op',
        sourceBridge: address(log.address),
        destinationBridge: OP_BRIDGE,
        sourceToken: address(parsed.args.localToken),
        destinationToken: address(parsed.args.remoteToken),
        sender: address(parsed.args.from),
        recipient: address(parsed.args.to),
        amount: parsed.args.amount,
        extraData: parsed.args.extraData,
        destinationChain,
      });
    }
  }
  return found;
}

function arbitrumInitiations(chain: Chain, logs: readonly BridgeLog[]): Initiation[] {
  if (chain.id !== 'ethereum') return [];
  const found: Initiation[] = [];
  for (const log of logs) {
    const destinationBridge = ARBITRUM_GATEWAY_PAIRS[address(log.address)];
    if (!destinationBridge) continue;
    let parsed;
    try { parsed = arbitrum.parseLog(log); } catch { continue; }
    if (parsed?.name !== 'DepositInitiated') continue;
    const args = parsed.args;
    found.push({
      protocol: 'arbitrum',
      sourceBridge: address(log.address),
      destinationBridge,
      sourceToken: address(args.l1Token),
      sender: address(args.from),
      recipient: address(args.to),
      amount: args.amount,
      destinationChain: 'arbitrum',
    });
  }
  return found;
}

export function collectBridgeInitiations(chain: Chain, logs: readonly BridgeLog[]): Initiation[] {
  return [...opInitiations(chain, logs), ...arbitrumInitiations(chain, logs)];
}

function candidateFilter(initiation: Initiation) {
  if (initiation.protocol === 'op') {
    const name = initiation.sourceToken === ZeroAddress ? 'ETHBridgeFinalized' : 'ERC20BridgeFinalized';
    const topic = op.getEvent(name)!.topicHash;
    return initiation.sourceToken === ZeroAddress
      ? [topic, topicAddress(initiation.sender), topicAddress(initiation.recipient)]
      : [topic, topicAddress(initiation.destinationToken!), topicAddress(initiation.sourceToken), topicAddress(initiation.sender)];
  }
  const topic = arbitrum.getEvent('DepositFinalized')!.topicHash;
  return [topic, topicAddress(initiation.sender), topicAddress(initiation.recipient)];
}

export function bridgeFinalizationMatches(initiation: Initiation, log: BridgeLog): boolean {
  if (address(log.address) !== initiation.destinationBridge) return false;
  let parsed;
  try { parsed = (initiation.protocol === 'op' ? op : arbitrum).parseLog(log); } catch { return false; }
  if (!parsed) return false;
  if (initiation.protocol === 'op' && initiation.sourceToken === ZeroAddress) {
    return parsed.name === 'ETHBridgeFinalized'
      && address(parsed.args.from) === initiation.sender
      && address(parsed.args.to) === initiation.recipient
      && parsed.args.amount === initiation.amount
      && parsed.args.extraData === initiation.extraData;
  }
  if (initiation.protocol === 'op') {
    return parsed.name === 'ERC20BridgeFinalized'
      && address(parsed.args.localToken) === initiation.destinationToken
      && address(parsed.args.remoteToken) === initiation.sourceToken
      && address(parsed.args.from) === initiation.sender
      && address(parsed.args.to) === initiation.recipient
      && parsed.args.amount === initiation.amount
      && parsed.args.extraData === initiation.extraData;
  }
  return parsed.name === 'DepositFinalized'
    && address(parsed.args.l1Token) === initiation.sourceToken
    && address(parsed.args.from) === initiation.sender
    && address(parsed.args.to) === initiation.recipient
    && parsed.args.amount === initiation.amount;
}

export function uniqueFinalization<T extends BridgeLog>(initiation: Initiation, logs: readonly T[]): T | null {
  const matches = logs.filter((log) => bridgeFinalizationMatches(initiation, log));
  return matches.length === 1 ? matches[0] : null;
}

export async function blockAtOrBeforeTimestamp(
  timestamp: number,
  tip: number,
  getTimestamp: (blockNumber: number) => Promise<number>,
): Promise<number> {
  let low = 0;
  let high = tip;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (await getTimestamp(middle) <= timestamp) low = middle;
    else high = middle - 1;
  }
  return low;
}

export async function matchBridgeFinalization(
  initiation: Initiation,
  sourceTimestamp: number,
): Promise<Log | null> {
  const destination = CHAINS[initiation.destinationChain];
  const provider = getProvider(destination);
  const tip = await provider.getBlockNumber();
  const approximateSourceBlock = await blockAtOrBeforeTimestamp(sourceTimestamp, tip, async (blockNumber) => {
    const block = await provider.getBlock(blockNumber);
    if (!block) throw new Error(`Could not read ${destination.name} block ${blockNumber} while locating the bridge window.`);
    return block.timestamp;
  });
  const start = Math.max(0, approximateSourceBlock - 100);
  const end = Math.min(tip, start + MAX_LOOKAHEAD_BLOCKS);
  const addresses = [initiation.destinationBridge];
  const topics = candidateFilter(initiation);
  const candidates: Log[] = [];

  for (let from = start; from <= end; from += LOG_RANGE) {
    const to = Math.min(end, from + LOG_RANGE - 1);
    for (const address of addresses) {
      const logs = await provider.getLogs({ address, fromBlock: from, toBlock: to, topics });
      candidates.push(...logs);
    }
  }
  return uniqueFinalization(initiation, candidates);
}

export async function followCanonicalBridge(
  chain: Chain,
  txHash: string,
  sourceTimestamp: number,
  bridgeAddress: string,
  sender: string,
  asset: string,
  value: number,
): Promise<BridgeContinuation[]> {
  const receipt = await getProvider(chain).getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) return [];
  const initiations = collectBridgeInitiations(chain, receipt.logs).filter((initiation) => {
    if (initiation.sourceBridge !== address(bridgeAddress) || initiation.sender !== address(sender)) return false;
    if (initiation.sourceToken === ZeroAddress) return asset === chain.native && Number(formatUnits(initiation.amount, 18)) === value;
    const token = chain.tokens[initiation.sourceToken];
    return token?.symbol === asset && Number(formatUnits(initiation.amount, token.decimals)) === value;
  });
  const continuations: BridgeContinuation[] = [];

  for (const initiation of initiations) {
    if (initiation.protocol === 'arbitrum' && initiation.sourceToken === ZeroAddress) continue;
    const destinationLog = await matchBridgeFinalization(initiation, sourceTimestamp);
    if (!destinationLog) continue;
    const block = await getProvider(CHAINS[initiation.destinationChain]).getBlock(destinationLog.blockNumber);
    if (!block) continue;
    continuations.push({
      sourceChain: chain.id,
      destinationChain: initiation.destinationChain,
      sourceTxHash: txHash,
      destinationTxHash: destinationLog.transactionHash,
      sender: initiation.sender,
      recipient: initiation.recipient,
      asset,
      value,
      timestamp: block.timestamp,
      destinationBlock: destinationLog.blockNumber,
      bridge: initiation.sourceBridge,
    });
  }
  return continuations;
}

export const bridgeTestInterfaces = { op, arbitrum };
