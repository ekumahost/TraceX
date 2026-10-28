/**
 * TraceX AI - Unified AI Layer using Meta + Fireworks + Baseten
 * Meta Model API serves Muse Spark; Fireworks + Baseten serve Meta Llama 3.3 70B
 * Built for https://cerebralvalley.ai/e/meta-ai-developer-hackathon
 */

import { explainWithMetaAPI, askQuestionWithMetaAPI } from './meta';
import { explainTraceWithFireworks, askQuestionWithFireworks } from './fireworks';
import { explainWithBaseten } from './baseten';

export type Provider = 'meta' | 'fireworks' | 'baseten';

const PROVIDERS: Provider[] = ['meta', 'fireworks', 'baseten'];

export function isProvider(value: any): value is Provider {
  return PROVIDERS.includes(value);
}

const explainers: Record<Provider, (graphJson: any, heuristics: any) => Promise<string | null>> = {
  meta: explainWithMetaAPI,
  fireworks: explainTraceWithFireworks,
  baseten: explainWithBaseten,
};

// Baseten deployment takes a raw prompt only, so Q&A runs on Meta + Fireworks
const askers: Partial<Record<Provider, (question: string, graphJson: any) => Promise<string | null>>> = {
  meta: askQuestionWithMetaAPI,
  fireworks: askQuestionWithFireworks,
};

function defaultProvider(): Provider {
  const env = process.env.AI_PROVIDER;
  return isProvider(env) ? env : 'meta';
}

// Tries the preferred provider first, then the rest. Throws if every provider fails -
// never returns placeholder text, so callers can't mistake a failure for a model answer.
async function runWithFallback<T extends (...args: any[]) => Promise<string | null>>(
  handlers: Partial<Record<Provider, T>>,
  preferred: Provider,
  args: Parameters<T>,
) {
  const order = [preferred, ...PROVIDERS.filter((p) => p !== preferred)];
  const errors: string[] = [];

  for (const provider of order) {
    const handler = handlers[provider];
    if (!handler) continue;
    try {
      const text = await handler(...args);
      if (!text) throw new Error('empty response');
      console.log(`TraceX AI answered via ${provider}`);
      return { provider, text };
    } catch (e: any) {
      console.error(`TraceX AI provider ${provider} failed:`, e?.message ?? e);
      errors.push(`${provider}: ${e?.message ?? e}`);
    }
  }

  throw new Error(`All AI providers failed - ${errors.join('; ')}`);
}

export function explainTraceUnified(graphJson: any, heuristics: any, preferred: Provider = defaultProvider()) {
  return runWithFallback(explainers, preferred, [graphJson, heuristics]);
}

export function askQuestionUnified(question: string, graphJson: any, preferred: Provider = defaultProvider()) {
  return runWithFallback(askers, preferred, [question, graphJson]);
}
