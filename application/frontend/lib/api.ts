import type { AIAnswer, Provider, TraceCase } from './types';

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

// Returns null when the backend can't produce a real trace yet (offline or empty graph)
export async function fetchTrace(input: string, hops = 5): Promise<TraceCase | null> {
  try {
    const data = await post<any>('/api/trace', { input, hops });
    const nodes = data.graph?.nodes ?? [];
    if (!nodes.length) return null;
    return {
      input,
      network: data.network ?? 'Ethereum',
      nodes,
      edges: data.graph.edges ?? [],
      risks: data.heuristics ?? data.risks ?? [],
    };
  } catch {
    return null;
  }
}

const graphPayload = (c: TraceCase) => ({ nodes: c.nodes, edges: c.edges, input: c.input, network: c.network });

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
