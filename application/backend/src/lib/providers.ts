import OpenAI from 'openai';

/**
 * The three model providers behind TraceX's AI layer. All speak the OpenAI chat-completions
 * protocol, so one client covers them; each serves a Meta Muse Spark model.
 *
 * - meta:      Muse Spark via the Meta Model API            META_API_KEY      (https://dev.meta.ai)
 * - fireworks: Muse Spark Open via Fireworks AI serverless  FIREWORKS_API_KEY (https://fireworks.ai)
 * - baseten:   Muse Spark Open via Baseten Model APIs       BASETEN_API_KEY   (https://app.baseten.co)
 *
 * Models and base URLs can be overridden per provider (META_MODEL, FIREWORKS_MODEL, BASETEN_MODEL, ...).
 */

export type Provider = 'meta' | 'fireworks' | 'baseten';
export const PROVIDERS: Provider[] = ['meta', 'fireworks', 'baseten'];

export function isProvider(value: any): value is Provider {
  return PROVIDERS.includes(value);
}

interface Spec {
  name: string;
  keyEnv: string;
  baseURL: () => string;
  model: () => string;
}

const SPECS: Record<Provider, Spec> = {
  meta: {
    name: 'Meta Model API',
    keyEnv: 'META_API_KEY',
    baseURL: () => process.env.META_API_BASE_URL || 'https://api.meta.ai/v1',
    model: () => process.env.META_MODEL || 'muse-spark-1.3',
  },
  fireworks: {
    name: 'Fireworks AI',
    keyEnv: 'FIREWORKS_API_KEY',
    baseURL: () => process.env.FIREWORKS_BASE_URL || 'https://api.fireworks.ai/inference/v1',
    model: () => process.env.FIREWORKS_MODEL || 'accounts/fireworks/models/muse-spark-open',
  },
  baseten: {
    name: 'Baseten',
    keyEnv: 'BASETEN_API_KEY',
    baseURL: () => process.env.BASETEN_BASE_URL || 'https://inference.baseten.co/v1',
    model: () => process.env.BASETEN_MODEL || 'meta-models/muse-spark-open',
  },
};

export const isConfigured = (p: Provider) => Boolean(process.env[SPECS[p].keyEnv]);
export const modelOf = (p: Provider) => SPECS[p].model();

export function providerStatus() {
  return PROVIDERS.map((id) => ({ id, via: SPECS[id].name, model: modelOf(id), configured: isConfigured(id) }));
}

// Muse Spark (and Muse Spark Open on the partners) reasons before it answers, and reasoning
// tokens count against max_tokens - so the budget has to cover both. Low effort answers a case
// in ~10s; medium takes ~2x.
const META_BUDGET = 12_000;
const effort = () => (process.env.META_REASONING_EFFORT || 'low') as 'low' | 'medium' | 'high';

export async function chat(
  provider: Provider,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  maxTokens = 2_000,
): Promise<string | null> {
  const spec = SPECS[provider];
  const apiKey = process.env[spec.keyEnv];
  if (!apiKey) throw new Error(`no key - set ${spec.keyEnv}`);
  const client = new OpenAI({ baseURL: spec.baseURL(), apiKey, timeout: 90_000, maxRetries: 1 });

  const response = await client.chat.completions.create({
    model: spec.model(),
    messages,
    temperature: 0.1, // low for evidence-backed answers
    ...(/muse-spark/i.test(spec.model())
      ? { max_tokens: Math.max(META_BUDGET, maxTokens), reasoning_effort: effort() }
      : { max_tokens: maxTokens }),
  });

  const choice = response.choices[0];
  if (!choice?.message.content && choice?.finish_reason === 'length') {
    throw new Error(/muse-spark/i.test(spec.model())
      ? 'Muse Spark used its whole token budget reasoning - try META_REASONING_EFFORT=low'
      : 'the model ran out of tokens before answering');
  }
  return choice?.message.content ?? null;
}
