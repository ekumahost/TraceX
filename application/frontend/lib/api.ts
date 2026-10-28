import type { AIAnswer, Provider, RecoveryDocuments, RecoveryLanguage, ShieldResult, TraceCase } from './types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export async function fetchTrace(input: string, chain = 'auto', hops = 5): Promise<{ data: TraceCase } | { error: string }> {
  try {
    const data = await post<any>('/api/trace', { input, hops, chain });
    return {
      data: {
        input: data.input ?? input,
        network: data.network ?? 'Ethereum',
        chain: data.chain,
        explorer: data.explorer,
        nodes: data.graph?.nodes ?? [],
        edges: data.graph?.edges ?? [],
        risks: data.heuristics ?? [],
        source: data.source,
        score: data.score,
        engine: data.engine,
        incomplete: data.incomplete ?? [],
        hops: data.hops ?? hops,
      },
    };
  } catch (e: any) {
    return { error: /(Failed to fetch|NetworkError|Load failed)/i.test(e.message) ? 'the TraceX backend isn’t reachable' : e.message };
  }
}

export function scanWallet(address: string, chain: string) {
  return post<ShieldResult>('/api/shield', { address, chain });
}

const graphPayload = (c: TraceCase) => ({ nodes: c.nodes, edges: c.edges, input: c.input, network: c.network });

export function generateRecoveryKit(c: TraceCase, exchange: string, language: RecoveryLanguage) {
  return post<RecoveryDocuments>('/api/recovery-kit', {
    input: c.input,
    chain: c.chain ?? 'auto',
    hops: c.hops ?? 5,
    exchange,
    language,
  });
}

export function explainCase(c: TraceCase) {
  return post<AIAnswer>('/api/explain', { graph: graphPayload(c), heuristics: c.risks });
}

export function askCase(question: string, c: TraceCase) {
  return post<AIAnswer>('/api/ask', { question, graph: { ...graphPayload(c), heuristics: c.risks } });
}

export const PROVIDER_LABEL: Record<Provider, { model: string; via: string }> = {
  meta: { model: 'Muse Spark', via: 'Meta Model API' },
  fireworks: { model: 'Llama 3.3 70B', via: 'Fireworks AI' },
  baseten: { model: 'Llama 3.3 70B', via: 'Baseten' },
};
