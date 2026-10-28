# TraceX AI - Meta Global AI Developer Hackathon Submission Pack
Prepared: 2026-10-27
Project: TraceX AI - Intelligent Blockchain Investigation Platform
Builder: Okokoh Benjamin
For: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026.

## 1. PROJECT BASICS
Project Name: TraceX AI
Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026.
Track: Indie Developer Track
Theme: Build for Your World
Builder: Okokoh Benjamin

## 2. ELEVATOR PITCH
TraceX AI is an action-oriented blockchain investigation system, not just a chatbot. Users paste a tx hash or wallet, TraceX retrieves real on-chain data from Alchemy/Etherscan, builds fund flow graph up to 20 hops, runs heuristics (mixer, peel chains, exchange hopping) on Modal serverless, then uses Meta Llama 3.3 via Meta Model API + Fireworks + Baseten to explain trail in plain English with tx citations and generate evidence-backed PDF report. Built by Okokoh Benjamin for Meta AI Developer Hackathon 2026.

## 3. PROBLEM
$4B+ lost yearly to crypto scams but explorers show raw data not story. Investigation takes hours. Tools like Chainalysis expensive closed-source $10k/month. Users in emerging markets like Nigeria have no affordable way to verify risky wallets before sending funds.

## 4. SOLUTION
Input tx hash/wallet/ENS -> Fetcher (Alchemy + Etherscan + Covalent) cached in Redis -> Graph Builder BFS with loop avoidance -> Python FastAPI + NetworkX heuristics RUNNING ON MODAL SERVERLESS (deployed, scales to zero between traces, no servers or Kubernetes to manage) -> Meta Llama via 3 paths: Meta Model API Standard ($150 credits), Fireworks AI (fastest 160 tokens/sec, $0.90/M, $25 credits), Baseten dedicated (99.9% uptime, $100 + 2M TPM) with citation enforcement to prevent hallucination -> React Flow graph + Timeline + Evidence Panel + AI Summary + PDF export. Evidence-backed: every AI claim cites tx hash.

## 5. HOW WE USED META AI PRODUCTS + FIREWORKS + MODAL + BASETEN (25% score) - CRITICAL

a) Muse Spark / Llama 3.3 via Meta Model API (Core - $150 credits):
Used for transaction explanation, Q&A over trace, report generation. Prompt: You are TraceX investigator. Given deterministic trace {graph_json} Heuristics {heuristics} Explain what happened, cite tx hashes, highlight suspicious patterns, suggest next steps. Never invent data. Model: llama-3.3-70b-instruct Standard mode. Built by Okokoh Benjamin.

b) Fireworks AI - Fastest Inference Partner ($25 credits + workshop from Sinan Ozdemir):
What: Proprietary inference engine for open models, 160 tokens/sec for Llama 3.3 70B, time-to-first-token 440ms, $0.90/M output (4x cheaper than Meta Standard $4.25/M), 131k context, function calling Firefunction V2, OpenAI-compatible API https://api.fireworks.ai/inference/v1, model accounts/fireworks/models/llama-v3p3-70b-instruct.
How TraceX uses: Primary LLM for demo because fastest + cheapest. File: backend/src/lib/fireworks.ts - explainTraceWithFireworks() with low temp 0.1 for evidence-backed. For hackathon demo video, shows real-time explanation in <1 sec.

c) Modal - Serverless Python Cloud ($100 credits) - DEPLOYED:
What: Serverless platform for Python. You write a normal function, `modal deploy` packages it into a container and serves it over HTTPS; it scales up with traffic and down to zero when idle, billed per second.
How TraceX uses: The Python analysis engine (FastAPI + NetworkX) runs on Modal. It takes the traced fund-flow graph and runs the detectors - mixer deposits and withdrawals, peel chains, high-velocity movement, exchange cash-outs, exchange hopping, bridge exits - then scores the case 0-100 and scores each wallet.
- Live endpoint: https://ifihear--tracex-analysis-engine-web.us-east.modal.run (POST /analyze)
- File: application/analysis-engine/modal_app.py - `modal.App("tracex-analysis-engine")`, a debian_slim image with fastapi + networkx, served with `@modal.asgi_app()`. Detectors in application/analysis-engine/app/heuristics.py.
- Backend calls it from application/backend/src/services/analysis.ts via ANALYSIS_ENGINE_URL; the UI shows "Heuristics · Python · Modal" on every live trace.
- Resilient: if Modal is unreachable the backend falls back to an identical TypeScript copy of the detectors, so a trace never fails. A parity test (application/analysis-engine/tests) proves both produce the same findings.
- Benefits: no server to run, scales when many investigators trace at once, costs nothing when idle. Future: Modal Sandboxes to safely run user-written investigation scripts.

d) Baseten - Mission-Critical Model Deployment ($100 credits + 2M TPM):
What: High-performance platform for production AI inference, for mission-critical workloads, ultra-low latency, high throughput, autoscaling, deploy models on Baseten cloud/your cloud/hybrid, dedicated deployments with 8-char model_id abcd1234, dashboard https://app.baseten.co/overview, LlamaIndex compatible.
How TraceX uses: Dedicated reliable Llama 3.3 70B deployment for compliance use-case. File: backend/src/lib/baseten.ts - explainWithBaseten() calls https://model-${modelId}.api.baseten.co/production/predict with Api-Key auth. For exchanges needing 99.9% uptime for PDF report generation, and for law enforcement needing VPC deployment for privacy. Hybrid: Baseten for prod, Fireworks for dev/fast demo.

e) Meta AI Desktop App + Muse:
Built entire platform using Meta AI desktop as IDE assistant in /Applications/WEBSITE/TraceX by Okokoh Benjamin. Scaffolding Next.js frontend, backend, Python engine, docs. Accelerated from idea to MVP in 10 days.

f) Muse Code:
Agentic coding for multi-step tasks: React Flow components, graph builder, heuristics, unified AI layer with fallback Fireworks -> Baseten -> Meta API. Built by Okokoh Benjamin.

g) Muse Image:
For generating visual investigation diagrams for PDF reports and architecture diagram.

h) Open-weights via Baseten/Modal/Fireworks:
Tested local deployment of Llama for privacy-sensitive investigations where data cannot leave environment. All three are official inference partners listed on https://cerebralvalley.ai/e/meta-ai-developer-hackathon.

Beyond basic integration: We feed structured deterministic blockchain evidence to Llama and force citation, solving hallucination in high-stakes finance. Multi-model pipeline: Data -> Graph -> Heuristics (Modal) -> Llama reasoning (Meta API + Fireworks + Baseten) -> Report. Shows production readiness. Built by Okokoh Benjamin.

Files:
- backend/src/lib/fireworks.ts
- backend/src/lib/baseten.ts
- backend/src/lib/ai-unified.ts - Unified layer with fallback
- analysis-engine/modal_app.py - Modal deployment (live: https://ifihear--tracex-analysis-engine-web.us-east.modal.run)
- analysis-engine/app/heuristics.py - NetworkX detectors + case score
- backend/src/services/analysis.ts - calls Modal, falls back to built-in detectors
- docs/integrations-fireworks-modal-baseten.md - Full doc

## 6. ARCHITECTURE
Frontend Next.js 14 TS Tailwind shadcn React Flow -> API Gateway Vercel -> Fetcher Alchemy Etherscan Covalent Redis Postgres -> Analysis Engine RUNNING ON MODAL (@modal.asgi_app, scales to zero when idle) -> AI Layer 3 OPTIONS: 1) Meta Model API Standard $150 credits primary, 2) Fireworks AI 160 tokens/sec $0.90/M $25 credits fastest, 3) Baseten dedicated 99.9% uptime $100 + 2M TPM for prod -> Response Graph JSON + Timeline + AI Summary -> React Flow Graph + Evidence Panel + PDF Export

Stack: Next.js 14, TypeScript, Tailwind, React Flow, Node Express, Python FastAPI NetworkX RUNNING ON MODAL SERVERLESS, Alchemy, Etherscan, Meta Model API Llama 3.3 + Fireworks AI + Baseten, Postgres Redis, Docker Vercel Fly.io Modal Baseten Fireworks

Builder: Okokoh Benjamin

## 7. DEMO LINKS (Fill before submit)
Demo Video: [INSERT YOUTUBE LINK 2-3min] - Show trace with Fireworks fast inference + Modal analysis + Baseten reliable report
Live Demo: https://tracex-ai.vercel.app
GitHub: https://github.com/ekumahost/TraceX - Public repo by Okokoh Benjamin
Modal analysis engine (live): https://ifihear--tracex-analysis-engine-web.us-east.modal.run

## 8. IMPACT (30% score)
Who Benefits: 400M+ crypto users, indie devs building compliance, exchanges in emerging markets like Nigeria where Okokoh Benjamin is based, security researchers, law enforcement.
Why Now: Crypto adoption up in Africa but scams up faster. No affordable AI-explainable open tool exists. Llama + Fireworks + Baseten + Modal makes production-ready evidence-backed AI possible at 4x lower cost.

## 9. FUTURE
Phase1 MVP: ETH 5 hops graph AI summary PDF using Fireworks fast + Modal serverless - Built by Okokoh Benjamin
Phase2: Multi-chain Base Polygon BSC Neo4j accounts saved investigations Bitcoin UTXO, Baseten dedicated for compliance
Phase3: Real-time monitoring alerts collaborative investigations mobile app, Modal Sandboxes for safe user scripts, on-device Llama via Glimmer

## 10. TEAM
Team Name: TraceX AI
Builder: Okokoh Benjamin - Full-stack Blockchain + AI - Built entire platform frontend, fetcher, Modal integration, Fireworks + Baseten AI layer, docs
Location: Enugu, Nigeria
GitHub: ekumahost

## 11. FEEDBACK FROM YOUR EXPERIENCE USING META PRODUCTS (PASTE THIS FOR PORTAL)

We built TraceX AI entirely with Meta ecosystem + Fireworks + Modal + Baseten and loved experience but want to share candid feedback - Built by Okokoh Benjamin:

What We Loved:
1. Meta AI Desktop App as IDE Assistant is powerful: Using Meta AI as coding partner inside our actual project folder (/Applications/WEBSITE/TraceX) accelerated us from idea to architecture to code in hours. It understood blockchain + AI vision and suggested right stack (Next.js + Python FastAPI + Llama) and how to integrate Fireworks, Modal, Baseten.
2. Muse Spark / Llama via Meta Model API + Fireworks + Baseten incredibly capable for evidence-backed reasoning: Prompting with structured JSON and forcing citation of tx hashes produced accurate hallucination-free explanations - critical for financial investigations. Standard mode pricing fair, Fireworks 160 tokens/sec makes demo wow factor, Baseten dedicated gives reliability for compliance, Modal serverless eliminates DevOps.
3. Muse Code agentic coding: Helped plan multi-step tasks like building React Flow graph components and Python heuristics engine and wiring 3 partner platforms (Fireworks, Modal, Baseten). Felt like senior engineer pair-programming with Okokoh Benjamin.

Pain Points & Suggestions:
1. Files/Finder Integration Difficult: Biggest friction. We wanted to point Meta AI to generate code directly into /Applications/WEBSITE/TraceX but Files connection hidden under Settings -> Apps -> Files, not in System Settings. Error says user has not connected Files but doesn't guide new users. We wasted time thinking macOS permission issue. Suggestion: Add onboarding tooltip when user mentions local path like /Applications/... auto-prompt Do you want to connect your files? Allow connecting directly from approval card, not just Settings.
2. Folder Linking & Write Approval: Each file needs individual approval, and JSON files with double quotes sometimes fail due to escaping, forcing generator scripts (generate-package.js). Suggestion: Batch approvals for scaffolding project, fix JSON escaping.
3. API Credits & Model Discovery: $150 credits generous but discovering which model to use (Spark vs Wonder vs Glimmer) and geographic availability confusing. We are in Nigeria and had to check Geographic Use Policy separately. Also discovering Fireworks $25, Modal $100, Baseten $100 + 2M TPM credits and how they work together not clear in one place. Suggestion: Show credits usage real-time inside chat and suggest best model for task and when to use Fireworks vs Baseten vs Modal with one dashboard for hackathon.
4. Docs Gap for Multi-Model Pipelines + Partner Tools: Docs show single model call, but not best practices for chaining deterministic data -> heuristics (Modal) -> Llama (Fireworks/Baseten/Meta) with citation enforcement and fallback. Suggestion: Add hackathon recipe Evidence-backed AI pattern + Partner integration guide: When to use Fireworks for speed, Baseten for reliability, Modal for Python workloads.

Overall: Despite friction, Meta AI products + Fireworks + Modal + Baseten enabled Okokoh Benjamin to build TraceX AI - platform that would normally need team of 5 and months - in 10 days. Combination of Meta AI chat + Muse Code + Llama API + Fireworks fast inference + Modal serverless + Baseten dedicated is superpower for indie hackers in Nigeria. Fixing Files onboarding would make it 10x better. We must win this hackathon! Built for https://cerebralvalley.ai/e/meta-ai-developer-hackathon

## 12. CHECKLIST BEFORE SUBMITTING (Nov 4, 9pm ET)
- GitHub repo public https://github.com/ekumahost/TraceX with README, architecture.png, docs/integrations-fireworks-modal-baseten.md, .env.example, clear setup steps by Okokoh Benjamin
- Demo video 2-3 min YouTube showing Fireworks fast + Modal auto-scale
- Live demo Vercel + backend + Modal endpoint (Modal DEPLOYED 2026-10-28) + Fireworks + Baseten
- Fill all fields emphasizing use of 3 partners + Meta AI
- Test early
- Builder: Okokoh Benjamin

## 13. QUICK COPY-PASTE FOR PORTAL

Q: What did you build?
TraceX AI by Okokoh Benjamin - AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for Meta AI Developer Hackathon 2026. Paste tx hash/wallet, TraceX retrieves real on-chain data, builds fund flow graph up to 20 hops, runs heuristics (mixer, peel chains) on Modal serverless, then uses Meta Llama 3.3 via Meta Model API + Fireworks + Baseten to generate evidence-backed reports with tx citations.

Q: How does it use Meta AI?
Uses Llama 3.3 via 3 paths: Meta Model API Standard primary ($150), Fireworks AI fastest 160 tokens/sec $0.90/M for demo ($25 credits), Baseten dedicated 99.9% uptime for compliance ($100 + 2M TPM). Python analysis engine (NetworkX detectors + 0-100 risk score) is deployed on Modal serverless and scales to zero when idle ($100 credits). Evidence-backed with citation enforcement to prevent hallucination. Built by Okokoh Benjamin using Meta AI desktop and Muse Code in /Applications/WEBSITE/TraceX. Official partners from https://cerebralvalley.ai/e/meta-ai-developer-hackathon

Q: What is the impact?
Makes investigations accessible to 400M+ crypto users indie devs exchanges in emerging markets like Nigeria where Okokoh Benjamin is based who cannot afford $10k/month Chainalysis. Production-ready with Modal serverless + Baseten dedicated + Fireworks fast inference at 4x lower cost.

Q: Technical depth?
Combines multi-source blockchain aggregation BFS graph building with loop avoidance Python NetworkX heuristics deployed on Modal serverless (with a tested fallback so traces never fail) and Llama reasoning pipeline with evidence grounding across 3 inference platforms (Meta API + Fireworks + Baseten) with fallback. Real-time React Flow visualization. Built by Okokoh Benjamin.

Good luck! Built by Okokoh Benjamin - Let's win $1M with Fireworks, Modal, Baseten!
