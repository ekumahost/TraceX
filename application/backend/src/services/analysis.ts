import type { Risk, TraceEdge, TraceNode } from '../types';
import { fetchJson } from './http';
import { analyze } from './heuristics';

/**
 * Runs the detectors on the Python analysis engine (NetworkX, on Modal) when
 * ANALYSIS_ENGINE_URL is set, and falls back to the in-process TypeScript copy
 * if it isn't configured or doesn't answer - a trace never fails because of it.
 */

const WEIGHT = { high: 35, medium: 15, low: 5 };

export interface Analysis {
  risks: Risk[];
  score: number;
  engine: string;
}

export async function runAnalysis(nodes: TraceNode[], edges: TraceEdge[]): Promise<Analysis> {
  const url = process.env.ANALYSIS_ENGINE_URL?.replace(/\/$/, '');
  if (url) {
    try {
      const res = await fetchJson<{ risks: Risk[]; node_risk: Record<string, number>; score: number; engine: string }>(
        `${url}/analyze`,
        { method: 'POST', body: { nodes, edges }, timeoutMs: 30_000, retries: 1, cache: false },
      );
      for (const n of nodes) n.risk = res.node_risk[n.id] ?? n.risk;
      return { risks: res.risks, score: res.score, engine: /modal\.run/.test(url) ? 'Python · Modal' : 'Python' };
    } catch (e: any) {
      console.error('Analysis engine unavailable, using built-in detectors:', e.message);
    }
  }
  const risks = analyze(nodes, edges);
  return { risks, score: Math.min(100, risks.reduce((s, r) => s + WEIGHT[r.severity], 0)), engine: 'Built-in' };
}
