import OpenAI from 'openai';

/**
 * Meta Model API Integration for TraceX AI
 * Primary path - Meta Model API ($150 credits), serves Meta's Muse models
 * Official: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
 *
 * OpenAI SDK compatible. Docs: https://dev.meta.ai/docs/
 * Base URL: https://api.meta.ai/v1 (override with META_API_BASE_URL)
 * Model: muse-spark-1.3 (override with META_MODEL)
 * Get a key at https://dev.meta.ai → Dashboard → API keys
 */

function getClient() {
  const apiKey = process.env.META_API_KEY;
  if (!apiKey) {
    throw new Error('Meta Model API key missing - set META_API_KEY');
  }
  return new OpenAI({
    baseURL: process.env.META_API_BASE_URL || 'https://api.meta.ai/v1',
    apiKey,
  });
}

const model = () => process.env.META_MODEL || 'muse-spark-1.3';

export async function explainWithMetaAPI(graphJson: any, heuristics: any) {
  const prompt = `You are TraceX investigator - evidence-backed blockchain forensics.

Given deterministic trace:
Graph: ${JSON.stringify(graphJson).slice(0, 4000)}
Heuristics: ${JSON.stringify(heuristics)}

Explain what happened, cite tx hashes for every claim, highlight suspicious patterns (mixer, peel chain, exchange hopping), suggest next investigation steps. Never invent data.`;

  const response = await getClient().chat.completions.create({
    model: model(),
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1, // low for evidence-backed
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

export async function askQuestionWithMetaAPI(question: string, graphJson: any) {
  const response = await getClient().chat.completions.create({
    model: model(),
    messages: [
      { role: 'system', content: 'You are TraceX AI investigator. Answer only with evidence from provided trace, cite tx hashes.' },
      { role: 'user', content: `Question: ${question}\nTrace: ${JSON.stringify(graphJson).slice(0, 3000)}` },
    ],
    temperature: 0.1,
  });
  return response.choices[0].message.content;
}
