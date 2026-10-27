import { JsonRpcProvider, formatUnits } from 'ethers';
import type { Transfer } from '../types';
import { NotFoundError } from '../types';
import { TOKENS } from './tokens';

// RPC_URL wins, then Alchemy, then a free public node
let _provider: JsonRpcProvider | null = null;
function provider() {
  if (!_provider) {
    const url = process.env.RPC_URL
      || (process.env.ALCHEMY_API_KEY ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}` : 'https://ethereum-rpc.publicnode.com');
    _provider = new JsonRpcProvider(url, 1, { staticNetwork: true });
  }
  return _provider;
}

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const codeCache = new Map<string, boolean>();

export async function isContract(address: string) {
  if (!codeCache.has(address)) codeCache.set(address, (await provider().getCode(address)) !== '0x');
  return codeCache.get(address)!;
}

export async function resolveEns(name: string) {
  const address = await provider().resolveName(name).catch(() => null);
  if (!address) throw new NotFoundError(`${name} doesn't resolve to an address`);
  return address.toLowerCase();
}

// Value moved by one transaction: native ETH plus transfers of the tokens we follow
export async function transfersInTx(hash: string): Promise<Transfer[]> {
  const p = provider();
  const tx = await p.getTransaction(hash);
  if (!tx) throw new NotFoundError('Transaction not found on Ethereum mainnet');
  if (tx.blockNumber == null) throw new NotFoundError('Transaction is still pending');
  const [receipt, block] = await Promise.all([p.getTransactionReceipt(hash), p.getBlock(tx.blockNumber)]);
  if (receipt?.status === 0) throw new NotFoundError('Transaction failed on-chain, so no value moved');

  const base = { hash, timestamp: block!.timestamp, blockNumber: tx.blockNumber };
  const out: Transfer[] = [];
  if (tx.value > 0n && tx.to) {
    out.push({ ...base, from: tx.from.toLowerCase(), to: tx.to.toLowerCase(), value: Number(formatUnits(tx.value, 18)), asset: 'ETH' });
  }
  for (const log of receipt?.logs ?? []) {
    const token = TOKENS[log.address.toLowerCase()];
    if (!token || log.topics[0] !== TRANSFER_TOPIC || log.topics.length < 3) continue;
    out.push({
      ...base,
      from: '0x' + log.topics[1].slice(26),
      to: '0x' + log.topics[2].slice(26),
      value: Number(formatUnits(BigInt(log.data), token.decimals)),
      asset: token.symbol,
    });
  }
  return out;
}
