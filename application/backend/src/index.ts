import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

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

app.listen(PORT, () => {
  console.log(`TraceX backend listening on http://localhost:${PORT}`);
});
