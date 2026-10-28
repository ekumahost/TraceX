import { AbiCoder, JsonRpcProvider, formatUnits } from 'ethers';
import type { Transfer } from '../types';
import { NotFoundError } from '../types';
import { CHAINS, CHAIN_ORDER, type Chain } from './chains';

// RPC_URL (Ethereum only) wins, then Alchemy, then the chain's free public node
const providers = new Map<string, JsonRpcProvider>();
function provider(chain: Chain) {
  if (!providers.has(chain.id)) {
    const key = process.env.ALCHEMY_API_KEY;
    const url = (chain.id === 'ethereum' && process.env.RPC_URL)
      || (key && chain.alchemy ? `https://${chain.alchemy}.g.alchemy.com/v2/${key}` : chain.rpc);
    providers.set(chain.id, new JsonRpcProvider(url, chain.chainId, { staticNetwork: true }));
  }
  return providers.get(chain.id)!;
}

// Free public nodes don't serve old ("archive") data; turn their raw errors into a fix the user can act on
const ARCHIVE = /archive|personal token|missing trie node|header not found/i;
function friendly(chain: Chain, e: any): Error {
  const raw = e?.info?.error?.message ?? e?.error?.message ?? e?.shortMessage ?? e?.message ?? String(e);
  if (ARCHIVE.test(raw)) {
    return new Error(`The free public ${chain.name} node can't look this up (it needs archive access) - add a free ALCHEMY_API_KEY to application/backend/.env`);
  }
  return new Error(`${chain.name} RPC error: ${raw}`);
}

const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const codeCache = new Map<string, boolean>();

export async function isContract(chain: Chain, address: string) {
  const key = `${chain.id}:${address}`;
  if (!codeCache.has(key)) codeCache.set(key, (await provider(chain).getCode(address)) !== '0x');
  return codeCache.get(key)!;
}

// ENS lives on Ethereum; the resolved address can then be traced on any chain
export async function resolveEns(name: string) {
  const address = await provider(CHAINS.ethereum).resolveName(name).catch(() => null);
  if (!address) throw new NotFoundError(`${name} doesn't resolve to an address`);
  return address.toLowerCase();
}

// A tx hash doesn't say which chain it's on - ask them all, prefer the earliest in CHAIN_ORDER
export async function findTxChain(hash: string): Promise<Chain> {
  const found = await Promise.all(
    CHAIN_ORDER.map((id) => provider(CHAINS[id]).getTransaction(hash).then((tx) => !!tx).catch((e) => friendly(CHAINS[id], e))),
  );
  const i = found.indexOf(true);
  if (i >= 0) return CHAINS[CHAIN_ORDER[i]];
  const blind = CHAIN_ORDER.filter((_, j) => found[j] instanceof Error && ARCHIVE.test((found[j] as Error).message));
  if (blind.length) {
    throw new NotFoundError(`Not found on the chains we could search; the free public nodes for ${blind.map((id) => CHAINS[id].name).join(', ')} need archive access to look up transactions - add a free ALCHEMY_API_KEY to application/backend/.env`);
  }
  throw new NotFoundError(`Transaction not found on ${CHAIN_ORDER.map((id) => CHAINS[id].name).join(', ')}`);
}

// Value moved by one transaction: the native coin plus transfers of the tokens we follow
export async function transfersInTx(chain: Chain, hash: string): Promise<Transfer[]> {
  try {
    return await readTxTransfers(chain, hash);
  } catch (e) {
    throw e instanceof NotFoundError ? e : friendly(chain, e);
  }
}

async function readTxTransfers(chain: Chain, hash: string): Promise<Transfer[]> {
  const p = provider(chain);
  const tx = await p.getTransaction(hash);
  if (!tx) throw new NotFoundError(`Transaction not found on ${chain.name}`);
  if (tx.blockNumber == null) throw new NotFoundError('Transaction is still pending');
  const [receipt, block] = await Promise.all([p.getTransactionReceipt(hash), p.getBlock(tx.blockNumber)]);
  if (receipt?.status === 0) throw new NotFoundError('Transaction failed on-chain, so no value moved');

  const base = { hash, timestamp: block!.timestamp, blockNumber: tx.blockNumber };
  const out: Transfer[] = [];
  if (tx.value > 0n && tx.to) {
    out.push({ ...base, from: tx.from.toLowerCase(), to: tx.to.toLowerCase(), value: Number(formatUnits(tx.value, 18)), asset: chain.native });
  }
  for (const log of receipt?.logs ?? []) {
    const token = chain.tokens[log.address.toLowerCase()];
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

// Reads symbol() and decimals() - used by scripts/check-chains.ts to verify the token lists
export async function tokenInfo(chain: Chain, address: string) {
  const p = provider(chain);
  const [sym, dec] = await Promise.all([p.call({ to: address, data: '0x95d89b41' }), p.call({ to: address, data: '0x313ce567' })]);
  const coder = AbiCoder.defaultAbiCoder();
  return { symbol: coder.decode(['string'], sym)[0] as string, decimals: Number(coder.decode(['uint8'], dec)[0]) };
}
