import type { AIAnswer, TraceCase } from './types';

// Hands a case from the workspace to the printable report tab (same origin, so localStorage works)
export interface ReportBundle {
  data: TraceCase;
  query: string;
  score: number;
  brief: AIAnswer | null;
  generatedAt: string;
}

const KEY = 'tracex-report';

export function saveReport(bundle: ReportBundle) {
  try {
    localStorage.setItem(KEY, JSON.stringify(bundle));
    return true;
  } catch {
    return false;
  }
}

export function loadReport(): ReportBundle | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ReportBundle) : null;
  } catch {
    return null;
  }
}
