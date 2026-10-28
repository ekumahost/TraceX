import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { explainTraceUnified, askQuestionUnified, isProvider } from './lib/ai-unified';
import { traceCase } from './services/trace';
import { CHAINS, CHAIN_ORDER } from './services/chains';
import { InputError, NotFoundError } from './types';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'tracex-backend', version: '0.1.0' });
});

app.get('/api/chains', (_req, res) => {
  res.json(CHAIN_ORDER.map((id) => ({ id, name: CHAINS[id].name, native: CHAINS[id].native })));
});

app.post('/api/trace', async (req, res) => {
  const { input, hops = 5, chain } = req.body;
  if (!input || typeof input !== 'string') return res.status(400).json({ error: 'input required' });
  try {
    const t = await traceCase(input, Number(hops) || 5, typeof chain === 'string' ? chain : undefined);
    res.json({
      input: t.input,
      network: t.network,
      chain: t.chain.id,
      explorer: t.chain.explorer,
      hops,
      source: t.source,
      incomplete: t.incomplete,
      score: t.score,
      engine: t.engine,
      graph: { nodes: t.nodes, edges: t.edges },
      heuristics: t.risks,
    });
  } catch (e: any) {
    const status = e instanceof InputError ? 400 : e instanceof NotFoundError ? 404 : 502;
    res.status(status).json({ error: e.message });
  }
});

app.post('/api/explain', async (req, res) => {
  const { graph, heuristics = [], provider } = req.body;
  if (!graph) return res.status(400).json({ error: 'graph required' });
  if (provider !== undefined && !isProvider(provider)) {
    return res.status(400).json({ error: 'provider must be meta, fireworks or baseten' });
  }
  try {
    res.json(await explainTraceUnified(graph, heuristics, provider));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

app.post('/api/ask', async (req, res) => {
  const { question, graph, provider } = req.body;
  if (!question || !graph) return res.status(400).json({ error: 'question and graph required' });
  if (provider !== undefined && !isProvider(provider)) {
    return res.status(400).json({ error: 'provider must be meta, fireworks or baseten' });
  }
  try {
    res.json(await askQuestionUnified(question, graph, provider));
  } catch (e: any) {
    res.status(502).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`TraceX backend listening on http://localhost:${PORT}`);
});
