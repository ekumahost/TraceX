import { z } from 'zod';
import { draftRecoveryDocuments } from '../lib/meta';

export const RECOVERY_LANGUAGES = ['english', 'pidgin', 'igbo', 'yoruba', 'hausa'] as const;
export type RecoveryLanguage = (typeof RECOVERY_LANGUAGES)[number];

const LANGUAGE_NAMES: Record<RecoveryLanguage, string> = {
  english: 'English',
  pidgin: 'Nigerian Pidgin',
  igbo: 'Igbo',
  yoruba: 'Yoruba',
  hausa: 'Hausa',
};

const TX_RE = /0x[a-fA-F0-9]{64}/g;
const ADDRESS_RE = /0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g;

const documentResponse = z.object({
  freezeRequest: z.string().trim().min(1).max(20_000),
  policeReport: z.string().trim().min(1).max(20_000),
});

export interface RecoveryDocuments {
  provider: 'meta';
  freezeRequest: string;
  policeReport: string;
}

export function parseRecoveryDocuments(text: string) {
  const candidate = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('The model did not return the required recovery document format.');
  let value: unknown;
  try {
    value = JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new Error('The model returned invalid recovery document JSON. Retry the draft.');
  }
  const parsed = documentResponse.safeParse(value);
  if (!parsed.success) throw new Error('The model response was missing a recovery document. Retry the draft.');
  return parsed.data;
}

export function validateRecoveryCitations(text: string, hashes: Set<string>, addresses: Set<string>) {
  const citations = text.match(TX_RE) ?? [];
  if (!citations.length) throw new Error('The model did not cite any transaction in the case. Retry the draft.');
  if (citations.some((hash) => !hashes.has(hash.toLowerCase()))) {
    throw new Error('The model cited a transaction that is not in this case. Retry the draft.');
  }
  const citedHashes = new Set(citations.map((hash) => hash.toLowerCase()));
  if ([...hashes].some((hash) => !citedHashes.has(hash))) {
    throw new Error('The model did not cite every transaction in this case. Retry the draft.');
  }
  const citedAddresses = text.match(ADDRESS_RE) ?? [];
  if (citedAddresses.some((address) => !addresses.has(address.toLowerCase()))) {
    throw new Error('The model included a wallet address that is not in this case. Retry the draft.');
  }
}

export async function generateRecoveryDocuments(
  graph: { input: string; network: string; nodes: Array<{ id: string; address?: string; chain?: string; label?: string; type: string }>; edges: Array<{ from: string; to: string; txHash: string; destinationTxHash?: string; chain?: string; destinationChain?: string; value: number; asset: string; timestamp: string }> },
  heuristics: Array<{ type: string; severity: string; detail?: string; tx?: string }>,
  exchange: string,
  language: RecoveryLanguage,
): Promise<RecoveryDocuments> {
  if (!graph.edges.length) throw new Error('A Recovery Kit needs at least one on-chain transfer.');

  const hashes = new Set(graph.edges.flatMap((edge) => [edge.txHash, edge.destinationTxHash].filter(Boolean).map((hash) => hash!.toLowerCase())));
  if (hashes.size > 40) throw new Error('This case has more than 40 transactions. Use a narrower trace to generate a complete Recovery Kit.');
  const addresses = new Set(graph.nodes.map((node) => (node.address ?? node.id).toLowerCase()));
  const evidence = JSON.stringify({
    case: { input: graph.input, network: graph.network },
    // no exchange yet (e.g. funds went into a mixer): the model writes an [EXCHANGE NAME] placeholder
    targetExchange: exchange.trim() || '[EXCHANGE NAME] - not identified in this trace yet',
    transfers: graph.edges.map((edge) => ({
      txHash: edge.txHash,
      destinationTxHash: edge.destinationTxHash,
      chain: edge.chain,
      destinationChain: edge.destinationChain,
      from: graph.nodes.find((node) => node.id === edge.from)?.address ?? edge.from,
      to: graph.nodes.find((node) => node.id === edge.to)?.address ?? edge.to,
      amount: `${edge.value} ${edge.asset}`,
      timestamp: edge.timestamp,
    })),
    deterministicFindings: heuristics.map(({ type, severity, detail, tx }) => ({ type, severity, detail, tx })),
  });
  // The model sometimes skips a citation; every draft must cite every transaction and nothing
  // else, so retry a couple of times before showing the user an error.
  let lastError: Error = new Error('Recovery Kit generation failed.');
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await draftRecoveryDocuments(evidence, LANGUAGE_NAMES[language]);
      if (!raw) throw new Error('The Meta Model API returned an empty recovery draft.');
      const documents = parseRecoveryDocuments(raw);
      validateRecoveryCitations(documents.freezeRequest, hashes, addresses);
      validateRecoveryCitations(documents.policeReport, hashes, addresses);
      return { provider: 'meta', ...documents };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      console.warn(`Recovery Kit draft ${attempt}/3 rejected: ${lastError.message}`);
    }
  }
  throw lastError;
}
