import express from 'express';
import cors from 'cors';
import { explainTraceUnified, askQuestionUnified, isProvider } from './lib/ai-unified';
import { traceCase } from './services/trace';
import { CHAINS, CHAIN_ORDER } from './services/chains';
import { InputError, NotFoundError } from './types';
import { rateLimit } from './services/limit';
import { shieldWallet } from './services/poisoning';
import { generateRecoveryDocuments, RECOVERY_LANGUAGES } from './services/recovery';
import { z } from 'zod';

/** Builds the TraceX API. Reads env at call time so tests can configure it per instance. */
export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // real client IPs behind Render / Fly / Railway proxies

  // ALLOWED_ORIGINS=https://tracex.vercel.app,https://... ; unset = allow all (local dev)
  const origins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(cors(origins?.length ? { origin: origins } : undefined));
  app.use(express.json({ limit: '1mb' }));

  const traceLimit = rateLimit('traces', Number(process.env.TRACE_LIMIT_PER_HOUR ?? 30));
  const aiLimit = rateLimit('AI requests', Number(process.env.AI_LIMIT_PER_HOUR ?? 60));
  const recoveryRequestSchema = z.object({
    input: z.string().trim().min(1).max(100),
    chain: z.string().min(1).max(40).default('auto'),
    hops: z.number().int().min(1).max(20).default(5),
    exchange: z.string().trim().max(100).default(''), // optional - mixer cases may never reach an exchange
    language: z.enum(RECOVERY_LANGUAGES),
  });


  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'tracex-backend', version: '0.1.0' });
  });

  app.get('/api/chains', (_req, res) => {
    res.json(CHAIN_ORDER.map((id) => ({ id, name: CHAINS[id].name, native: CHAINS[id].native })));
  });

  app.post('/api/trace', traceLimit, async (req, res) => {
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
        crossChain: t.crossChain,
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

  app.post('/api/shield', traceLimit, async (req, res) => {
    const { address, chain } = req.body;
    if (!address || typeof address !== 'string') return res.status(400).json({ error: 'address required' });
    try {
      res.json(await shieldWallet(address, typeof chain === 'string' ? chain : undefined));
    } catch (e: any) {
      res.status(e instanceof InputError ? 400 : 502).json({ error: e.message });
    }
  });

  app.post('/api/explain', aiLimit, async (req, res) => {
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

  app.post('/api/ask', aiLimit, async (req, res) => {
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

  app.post('/api/recovery-kit', aiLimit, async (req, res) => {
    const parsed = recoveryRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid recovery-kit request', details: parsed.error.issues.map((issue) => issue.message) });
    try {
      const trace = await traceCase(parsed.data.input, parsed.data.hops, parsed.data.chain);
      res.json(await generateRecoveryDocuments(
        trace,
        trace.risks,
        parsed.data.exchange,
        parsed.data.language,
      ));
    } catch (e: any) {
      console.error('Recovery Kit generation failed:', e?.message ?? e);
      const status = e instanceof InputError ? 400 : e instanceof NotFoundError ? 404 : 502;
      res.status(status).json({ error: e instanceof Error ? e.message : 'Recovery Kit generation failed.' });
    }
  });

  return app;
}
