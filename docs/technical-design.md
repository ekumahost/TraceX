# TraceX AI - Technical Design Document
Version: 0.1.0 | Date: 2026-10-27

## 1. Tech Stack Recommendation

### Why this stack?
We need: amazing UI + heavy blockchain data fetching + deterministic graph analysis + AI reasoning + real-time interactivity.

**Recommended:**
- **Frontend: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui + Framer Motion**
  Reason: Best for amazing UI, server components, fast, great for data viz. React Flow for graph.

- **Backend API: Next.js API routes + tRPC or Next.js + NestJS (TypeScript)**
  Reason: Single language for velocity. For MVP, Next.js API routes are enough. For scale, separate NestJS service.

- **Analysis Engine: Python FastAPI + web3.py + NetworkX**
  Reason: Python is king for graph algorithms, heuristics, risk scoring. Keep deterministic analysis isolated and callable via API.

- **Databases:**
  - PostgreSQL + TimescaleDB: tx cache, investigations, user data
  - Redis: cache for Etherscan/Alchemy responses, rate limiting
  - Neo4j (optional Phase 2) or in-memory graph: for complex fund flow graph queries. MVP can use Postgres + NetworkX in-memory.

- **Blockchain Data Providers (Multi-source for evidence):**
  - Alchemy / Infura: node RPC (eth_getTransaction, traces)
  - Etherscan API: labels, internal txs, token transfers
  - Covalent / Moralis: enriched token transfers
  - The Graph (optional): for protocol-specific flows

- **AI Layer:**
  - Meta AI API / Llama 3.x via API: for interpretation, summarization, natural language Q&A over trace
  - Prompting strategy: Provide deterministic JSON trace + ask AI to explain, not to hallucinate data

- **Visualization:**
  - React Flow or Cytoscape.js: transaction graph (nodes = wallets, edges = transfers)
  - D3.js for timeline + value flow
  - Recharts for risk distribution

- **Infra:**
  - Docker + Docker Compose
  - Vercel (frontend) + Fly.io / Railway (backend + Python engine)

### Languages Summary
- **TypeScript (Primary - 70%)**: UI, API orchestration, blockchain fetching
- **Python (Secondary - 30%)**: Heuristics, graph analysis, risk engine
- **SQL/Cypher**: Querying

## 2. Architecture

```
[User Input: tx hash / address] 
   ↓
[Next.js Frontend - TraceX UI]
   ↓
[API Gateway - Next.js API / NestJS]
   ├─→ [Blockchain Fetcher Service] → Alchemy + Etherscan + Covalent (aggregated, cached in Redis/Postgres)
   ├─→ [Python Analysis Engine] → builds graph, runs heuristics, scores risk
   └─→ [AI Interpreter - Meta AI] → receives graph JSON + heuristics → returns natural language explanation + report
   ↓
[Response: Graph JSON + Timeline + AI Summary]
   ↓
[React Flow Graph + Evidence Panel + PDF Export]
```

### Data Flow for "Trace tx 0xabc..."
1. Parse input → detect chain, type (tx, address, ENS)
2. Fetcher: get tx receipt, internal traces, token transfers, from/to, value
3. Recursive fetch: for each output address, fetch next outgoing transfers (BFS up to N hops)
4. Build directed graph: Node {address, label, risk, firstSeen}, Edge {from, to, value, token, txHash, timestamp, block}
5. Python engine: run heuristics (mixer check against known list, peel chain detection, velocity check)
6. AI: prompt with graph summary + heuristics → generate human-readable narrative
7. Frontend renders graph + report

## 3. Folder Structure (Target: /Applications/WEBSITE/TraceX)

```
TraceX/
├── docs/
│   ├── requirements.md
│   ├── technical-design.md
│   └── architecture.png
├── application/
│   ├── frontend/          # Next.js 14
│   │   ├── app/
│   │   ├── components/    # graph, timeline, search, report
│   │   ├── lib/           # blockchain clients
│   │   └── ...
│   ├── backend/           # API + orchestration
│   │   ├── src/
│   │   │   ├── fetchers/  # alchemy, etherscan adapters
│   │   │   ├── graph/     # graph builder
│   │   │   └── ai/        # meta ai client
│   │   └── ...
│   ├── analysis-engine/   # Python FastAPI
│   │   ├── app/
│   │   │   ├── heuristics.py
│   │   │   ├── risk.py
│   │   │   └── graph.py
│   │   └── requirements.txt
│   └── docker-compose.yml
└── README.md
```

## 4. Key Modules

### 4.1 Blockchain Adapters (TypeScript)
- `AlchemyClient.getTransaction(hash)`
- `EtherscanClient.getInternalTxs(address)`
- `LabelResolver.resolve(address)` → returns {label: 'Binance', type: 'exchange'}

### 4.2 Graph Builder
- BFS with limits: maxHops, maxNodes=200, minValue filter
- Avoid loops via visited set

### 4.3 Heuristics Engine (Python)
- mixer_list = [Tornado Cash addresses]
- peel_chain: many small outs from one in
- exchange_hopping: quickly moves through CEXs

### 4.4 AI Prompt Template
```
You are TraceX investigator. Given this deterministic trace:
{graph_json}
Heuristics: {heuristics}
Explain in plain English what happened, cite tx hashes, highlight suspicious patterns, suggest next steps. Never invent data.
```

## 5. UI Design Direction (Amazing UI)
- Dark mode, slate background, neon blue/purple accents (cyber investigation)
- Left: Search + Filters, Center: Interactive Graph (React Flow), Right: Entity Inspector + AI Chat
- Bottom: Timeline slider
- Animations: Framer Motion for node expansion
- Inspiration: Arkham Intel + Linear + Chainalysis Reactor

## 6. Security
- No private keys
- Rate limit blockchain APIs
- Validate all addresses/tx hashes (regex)
- Sanitize AI output

## 7. Roadmap
Phase 1 MVP: ETH + 5 hops + graph + AI summary + PDF
Phase 2: Multi-chain, Neo4j, user accounts, saved investigations
Phase 3: Real-time monitoring, alerts, Bitcoin support
