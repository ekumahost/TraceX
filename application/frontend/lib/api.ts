import type { AIAnswer, Provider, ProviderInfo, RecoveryDocuments, RecoveryLanguage, ShieldResult, TraceCase } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API = API_URL;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

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
        crossChain: data.crossChain,
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

// 'auto' lets the backend pick: Muse Spark first, switching to the next provider if one fails
export type ProviderChoice = 'auto' | Provider;
const preferred = (choice: ProviderChoice) => (choice === 'auto' ? {} : { provider: choice });

export interface ScreenshotCandidate {
  kind: 'tx' | 'address' | 'ens';
  value: string;
  label?: string;
  chainShown?: string;
  verified: boolean;
  chains: string[];
  note: string;
}

export function readScreenshot(image: string) {
  return post<{ provider: Provider; model: string; candidates: ScreenshotCandidate[] }>('/api/extract', { image });
}

export async function transcribeStatement(wav: Blob, language: RecoveryLanguage) {
  const res = await fetch(`${API}/api/transcribe?language=${language}`, { method: 'POST', headers: { 'Content-Type': 'audio/wav' }, body: wav });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Transcription failed (${res.status})`);
  return data as { model: string; transcript: string; durationMs: number };
}

export function fetchProviders() {
  return get<ProviderInfo[]>('/api/providers');
}

export function generateRecoveryKit(c: TraceCase, exchange: string, language: RecoveryLanguage, choice: ProviderChoice = 'auto', statement = '') {
  return post<RecoveryDocuments>('/api/recovery-kit', {
    input: c.input,
    chain: c.chain ?? 'auto',
    hops: c.hops ?? 5,
    exchange,
    language,
    ...(statement.trim() ? { statement: statement.trim() } : {}),
    ...preferred(choice),
  });
}

export function explainCase(c: TraceCase, choice: ProviderChoice = 'auto') {
  return post<AIAnswer>('/api/explain', { graph: graphPayload(c), heuristics: c.risks, ...preferred(choice) });
}

export function askCase(question: string, c: TraceCase, choice: ProviderChoice = 'auto') {
  return post<AIAnswer>('/api/ask', { question, graph: { ...graphPayload(c), heuristics: c.risks }, ...preferred(choice) });
}

export const PROVIDER_LABEL: Record<Provider, { model: string; via: string; short: string }> = {
  meta: { model: 'Muse Spark', via: 'Meta Model API', short: 'Muse Spark' },
  fireworks: { model: 'Muse Spark Open', via: 'Fireworks AI', short: 'Fireworks' },
  baseten: { model: 'Muse Spark Open', via: 'Baseten', short: 'Baseten' },
};

// Human name for the model that answered, e.g. 'meta-models/muse-spark-open' -> 'Muse Spark Open', 'llama-v3p3-70b-instruct' -> 'Llama 3.3 70B'
export function modelName(provider: Provider, model?: string) {
  if (provider === 'meta' || !model) return PROVIDER_LABEL[provider].model;
  const id = model.split('/').pop()!.toLowerCase();
  if (id.startsWith('muse-spark')) return id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  const v = id.match(/llama[-_ ]?v?(\d)(?:p(\d)|[.-](\d))?/);
  if (!v) return model.split('/').pop()!;
  const version = v[2] ?? v[3] ? `${v[1]}.${v[2] ?? v[3]}` : v[1];
  const variant = id.match(/maverick|scout|(\d+)b/);
  const tail = variant ? (variant[1] ? `${variant[1]}B` : variant[0][0].toUpperCase() + variant[0].slice(1)) : '';
  return `Llama ${version}${tail ? ` ${tail}` : ''}`;
}
