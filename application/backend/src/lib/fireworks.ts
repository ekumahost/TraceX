import OpenAI from 'openai';

/**
 * Fireworks AI Integration for TraceX AI
 * Optional Llama 3.3 70B provider; configure FIREWORKS_API_KEY to enable it.
 * Model: accounts/fireworks/models/llama-v3p3-70b-instruct
 * Base URL: https://api.fireworks.ai/inference/v1
 */

function getClient() {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    throw new Error('Fireworks API key missing - set FIREWORKS_API_KEY');
  }
  return new OpenAI({
    baseURL: 'https://api.fireworks.ai/inference/v1',
    apiKey,
  });
}

export async function explainTraceWithFireworks(graphJson: any, heuristics: any) {
  const prompt = `You are TraceX investigator - evidence-backed blockchain forensics.

Given deterministic trace:
Graph: ${JSON.stringify(graphJson).slice(0, 4000)}
Heuristics: ${JSON.stringify(heuristics)}

Explain what happened, cite tx hashes for every claim, highlight suspicious patterns (mixer, peel chain, exchange hopping), suggest next investigation steps. Never invent data. Built for Meta AI Developer Hackathon 2026.

Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence.`;

  const response = await getClient().chat.completions.create({
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1, // low for evidence-backed
    max_tokens: 2000,
  });

  return response.choices[0].message.content;
}

export async function askQuestionWithFireworks(question: string, graphJson: any) {
  const response = await getClient().chat.completions.create({
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    messages: [
      { role: 'system', content: 'You are TraceX AI investigator. Answer only with evidence from provided trace, cite tx hashes.' },
      { role: 'user', content: `Question: ${question}\nTrace: ${JSON.stringify(graphJson).slice(0, 3000)}` },
    ],
    temperature: 0.1,
  });
  return response.choices[0].message.content;
}
