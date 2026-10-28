import { getChain, usdWeight, type Chain } from './chains';
import { rawTransfers, type RawTransfer } from './sources';
import { InputError } from '../types';

/**
 * Poisoning Shield - finds address-poisoning attacks against a wallet.
 *
 * Attackers generate addresses whose first and last characters match someone you really
 * transact with, then plant them in your history (dust, fake tokens, spoofed zero-value
 * transfers) hoping you copy the wrong one next time. We learn the wallet's real
 * counterparties from transfers of real value, then flag anything imitating them.
 */

export type PoisonKind = 'lookalike' | 'fake_token' | 'zero_transfer';

export interface PoisonFinding {
  kind: PoisonKind;
  imposter: string; // address planted in the history
  mimics?: string; // the real counterparty it imitates
  tx: string;
  value: number;
  asset: string;
  timestamp: string;
  detail: string;
}

export interface ShieldResult {
  address: string;
  chain: string;
  explorer: string;
  source: 'Alchemy';
  counterparties: number;
  scanned: number;
  scanLimitPerDirection: number;
  truncated: boolean;
  findingCount: number;
  findingsTruncated: boolean;
  findings: PoisonFinding[];
  imposters: string[];
}

const hex = (a: string) => a.toLowerCase().replace(/^0x/, '');
function sharedEnds(a: string, b: string) {
  const x = hex(a), y = hex(b);
  let pre = 0, suf = 0;
  while (pre < x.length && x[pre] === y[pre]) pre++;
  while (suf < x.length && x[x.length - 1 - suf] === y[y.length - 1 - suf]) suf++;
  return { pre, suf };
}
// What a wallet UI shows (0x1234…abcd) - matching 3+ characters at each end and 7+ in total fools people
export const looksAlike = (a: string, b: string) => {
  if (hex(a) === hex(b)) return false;
  const { pre, suf } = sharedEnds(a, b);
  return pre >= 3 && suf >= 3 && pre + suf >= 7;
};

const short = (a: string) => `${a.slice(0, 8)}…${a.slice(-6)}`;

export async function shieldWallet(address: string, chainId = 'ethereum'): Promise<ShieldResult> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) throw new InputError('Enter a 0x wallet address');
  const chain: Chain = getChain(chainId === 'auto' ? 'ethereum' : chainId);
  const me = address.trim().toLowerCase();
  const [incomingResult, outgoingResult] = await Promise.all([
    rawTransfers(chain, { toAddress: me }),
    rawTransfers(chain, { fromAddress: me }),
  ]);
  const incoming = incomingResult.transfers;
  const outgoing = outgoingResult.transfers;

  // real = at least ~$1 of the native coin or a verified token; dust is how poisoners plant themselves
  const isReal = (t: RawTransfer) => {
    if (t.category === 'external') return t.value * chain.nativeUsd >= 1;
    const token = t.contract ? chain.tokens[t.contract] : undefined;
    return token != null && t.value * usdWeight(chain, token.symbol) >= 1;
  };
  // counterparties proven by real value moving between them and this wallet
  const real = new Set<string>();
  for (const t of outgoing) if (isReal(t)) real.add(t.to);
  for (const t of incoming) if (isReal(t)) real.add(t.from);
  real.delete(me);

  const symbols = new Set([chain.native, ...Object.values(chain.tokens).map((t) => t.symbol)].map((s) => s.toUpperCase()));
  const findings: PoisonFinding[] = [];
  const at = (t: RawTransfer) => new Date(t.timestamp * 1000).toISOString();
  const mimicOf = (addr: string) => (real.has(addr) ? undefined : [...real].find((r) => looksAlike(addr, r)));

  for (const t of incoming) {
    // a token named like a real asset but from an unverified contract
    if (t.category === 'erc20' && t.contract && !chain.tokens[t.contract] && symbols.has(t.asset.trim().toUpperCase())) {
      findings.push({
        kind: 'fake_token', imposter: t.contract, mimics: t.from, tx: t.hash, value: t.value, asset: t.asset, timestamp: at(t),
        detail: `Fake "${t.asset}" token (${short(t.contract)}) - not the real ${t.asset}, but made to look like ${t.value} ${t.asset} from ${short(t.from)}.`,
      });
      continue;
    }
    const mimic = mimicOf(t.from);
    if (mimic) {
      findings.push({
        kind: 'lookalike', imposter: t.from, mimics: mimic, tx: t.hash, value: t.value, asset: t.asset, timestamp: at(t),
        detail: `${short(t.from)} imitates your real counterparty ${short(mimic)} and sent ${t.value ? `${t.value} ${t.asset}` : 'a zero-value transfer'} to plant itself in your history.`,
      });
    }
  }
  for (const t of outgoing) {
    // "sent" by this wallet, worth nothing, to a look-alike: a transferFrom spoof by the attacker
    const mimic = t.value === 0 ? mimicOf(t.to) : undefined;
    if (mimic) {
      findings.push({
        kind: 'zero_transfer', imposter: t.to, mimics: mimic, tx: t.hash, value: 0, asset: t.asset, timestamp: at(t),
        detail: `A 0 ${t.asset} transfer appears to go from your wallet to ${short(t.to)}, a look-alike of ${short(mimic)}. You didn't send it - the attacker did, so it shows up in your history.`,
      });
    }
  }

  findings.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const imposters = [...new Set(findings.filter((f) => f.kind !== 'fake_token').map((f) => f.imposter))];
  const visibleFindings = findings.slice(0, 60);
  return {
    address: me, chain: chain.id, explorer: chain.explorer, source: 'Alchemy', counterparties: real.size,
    scanned: incoming.length + outgoing.length, scanLimitPerDirection: 2000,
    truncated: incomingResult.truncated || outgoingResult.truncated,
    findingCount: findings.length, findingsTruncated: findings.length > visibleFindings.length,
    findings: visibleFindings, imposters,
  };
}
