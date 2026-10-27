import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { explainTraceUnified, askQuestionUnified, isProvider } from './lib/ai-unified';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'tracex-backend', version: '0.1.0' });
});

app.post('/api/trace', async (req, res) => {
  const { input, hops = 5 } = req.body;
  if (!input) return res.status(400).json({ error: 'input required' });
  res.json({
    input,
    hops,
    graph: { nodes: [], edges: [] },
    heuristics: [],
    message: 'Trace logic to be implemented - see technical-design.md'
  });
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
