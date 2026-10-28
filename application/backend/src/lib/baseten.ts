/**
 * Baseten Integration for TraceX AI
 * Optional Llama 3.3 70B explanation provider; configure both credentials to enable it.
 * 
 * Setup:
 * 1. Deploy a compatible model in Baseten
 * 2. Set BASETEN_MODEL_ID and BASETEN_API_KEY in the backend environment
 */

export async function explainWithBaseten(graphJson: any, heuristics: any) {
  const modelId = process.env.BASETEN_MODEL_ID;
  const apiKey = process.env.BASETEN_API_KEY;

  if (!modelId || !apiKey) {
    throw new Error('Baseten credentials missing - set BASETEN_MODEL_ID and BASETEN_API_KEY');
  }

  const prompt = `You are TraceX AI - AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for Meta AI Developer Hackathon 2026 https://cerebralvalley.ai/e/meta-ai-developer-hackathon

Given trace: ${JSON.stringify(graphJson).slice(0, 4000)}
Heuristics: ${JSON.stringify(heuristics)}

Generate evidence-backed report with tx citations. Never hallucinate.`;

  const response = await fetch(`https://model-${modelId}.api.baseten.co/production/predict`, {
    method: 'POST',
    headers: {
      'Authorization': `Api-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      max_tokens: 2000,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Baseten error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = extractText(data);
  if (!text) {
    throw new Error(`Baseten returned no text: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return text;
}

// Response shape depends on how the model was deployed (Truss, vLLM, TRT-LLM)
function extractText(data: any): string | undefined {
  if (typeof data === 'string') return data;
  return (
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.text ??
    data?.output ??
    data?.completion ??
    undefined
  );
}

export async function generateReportWithBaseten(traceData: any) {
  return explainWithBaseten(traceData.graph, traceData.heuristics);
}
