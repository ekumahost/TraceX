# TraceX AI - Meta Global AI Developer Hackathon Submission Pack
Prepared: 2026-10-27
Project: TraceX AI - Intelligent Blockchain Investigation Platform

## 1. PROJECT BASICS

**Project Name:** TraceX AI

**Tagline:**
Intelligent blockchain investigation platform that traces crypto transactions and generates evidence-backed reports with Meta AI.

**Track:** Indie Developer Track
**Theme:** Build for Your World (also fits Push the Frontier)

## 2. ELEVATOR PITCH
TraceX AI is an action-oriented blockchain investigation system, not just a chatbot. Users paste a tx hash or wallet, TraceX retrieves real on-chain data from Alchemy/Etherscan, builds fund flow graph up to 20 hops, runs heuristics (mixer, peel chains, exchange hopping), then uses Meta Llama to explain trail in plain English and generate evidence-backed PDF report.

## 3. PROBLEM
$4B+ lost yearly to crypto scams but explorers show raw data not story. Investigation takes hours. Tools like Chainalysis are expensive closed-source. Users in emerging markets have no affordable way to verify risky wallets.

## 4. SOLUTION
Input tx hash -> Fetcher (Alchemy + Etherscan) cached in Redis -> Graph Builder BFS -> Python FastAPI + NetworkX heuristics -> Meta Llama via Meta Model API with citation enforcement -> React Flow graph + AI report + PDF export. Evidence-backed: every AI claim cites tx hash.

## 5. HOW WE USED META AI PRODUCTS (25% score)

a) Muse Spark / Llama 3.3 via Meta Model API (Core):
Used for transaction explanation, Q&A over trace, report generation. Prompt: You are TraceX investigator. Given deterministic trace {graph_json} Heuristics {heuristics} Explain what happened, cite tx hashes, highlight suspicious patterns, suggest next steps. Never invent data. Model: llama-3.3-70b-instruct Standard mode.

b) Meta AI Desktop App + Muse:
Built entire platform using Meta AI desktop as IDE assistant. Scaffolding Next.js frontend, backend, Python engine, docs.

c) Muse Code:
Agentic coding for multi-step tasks: React Flow components, graph builder, heuristics.

d) Muse Image (planned): For report diagrams

e) Open-weights via Baseten/Modal: Local Llama deployment for privacy-sensitive investigations.

Beyond basic integration: We feed structured deterministic blockchain evidence to Llama and force citation, solving hallucination in high-stakes finance. Multi-model pipeline: Data -> Graph -> Heuristics -> Llama -> Report.

## 6. ARCHITECTURE
Frontend Next.js 14 TS Tailwind shadcn React Flow -> API Gateway -> Fetcher Alchemy Etherscan Covalent Redis Postgres -> Python FastAPI NetworkX -> Meta AI Llama -> Graph + Timeline + AI Chat + PDF

Stack: Next.js 14, TypeScript, Tailwind, React Flow, Node Express, Python FastAPI web3.py NetworkX, Alchemy, Etherscan, Meta Model API Llama 3.3, Postgres Redis, Docker Vercel Fly.io

## 7. DEMO LINKS (Fill before submit)
Demo Video: [INSERT YOUTUBE LINK 2-3min]
Live Demo: https://tracex-ai.vercel.app [INSERT]
GitHub: https://github.com/yourusername/tracex-ai [INSERT - make public]

## 8. IMPACT (30% score)
Who Benefits: 400M+ crypto users, indie devs building compliance, exchanges in emerging markets, security researchers, law enforcement.
Why Now: Crypto adoption up in Africa but scams up faster. No affordable AI-explainable open tool exists. Llama makes evidence-backed AI possible.

## 9. FUTURE
Phase1 MVP: ETH 5 hops graph AI summary PDF
Phase2: Multi-chain Base Polygon BSC Neo4j accounts saved investigations Bitcoin UTXO
Phase3: Real-time monitoring alerts collaborative investigations mobile on-device Llama Glimmer

## 10. TEAM
Team Name: [INSERT]
Members: [Your Name] - Full-stack Blockchain

## 11. FEEDBACK FROM YOUR EXPERIENCE USING META PRODUCTS (PASTE THIS)

We built TraceX AI entirely with Meta ecosystem and loved experience but want to share candid feedback:

What We Loved:
1. Meta AI Desktop App as IDE Assistant is powerful: Using Meta AI as coding partner inside our actual project folder (/Applications/WEBSITE/TraceX) accelerated us from idea to architecture to code in hours. It understood blockchain + AI vision and suggested right stack.
2. Muse Spark / Llama via Meta Model API is incredibly capable for evidence-backed reasoning: Prompting with structured JSON and forcing citation produced accurate hallucination-free explanations - critical for financial investigations. Pricing fair.
3. Muse Code agentic coding: Helped plan multi-step tasks like building React Flow graph components and Python heuristics. Felt like senior engineer pair-programming.

Pain Points & Suggestions:
1. Files/Finder Integration Difficult: Biggest friction. We wanted to point Meta AI to generate code directly into /Applications/WEBSITE/TraceX but Files connection hidden under Settings -> Apps -> Files, not System Settings. Error says user has not connected Files but doesn't guide. We wasted time thinking macOS permission issue. Suggestion: Add onboarding tooltip when user mentions local path like /Applications/... auto-prompt Do you want to connect your files? Allow connecting directly from approval card.
2. Folder Linking & Write Approval: Each file needs individual approval, and JSON files with double quotes sometimes fail due to escaping, forcing generator scripts. Suggestion: Batch approvals for scaffolding project, fix JSON escaping.
3. API Credits & Model Discovery: $150 credits generous but discovering which model to use (Spark vs Wonder vs Glimmer) and geographic availability confusing. We are in Nigeria and had to check Geographic Use Policy separately. Suggestion: Show credits usage real-time inside chat and suggest best model for task.
4. Docs Gap for Multi-Model Pipelines: Docs show single model call, not best practices for chaining deterministic data -> heuristics -> Llama with citation enforcement. Suggestion: Add hackathon recipe Evidence-backed AI pattern.

Overall: Despite friction, Meta AI products enabled us to build TraceX AI - platform that would normally need team of 5 and months - in 10 days. Combination of Meta AI chat + Muse Code + Llama API is superpower for indie hackers. Fixing Files onboarding would make it 10x better.

## 12. CHECKLIST
- GitHub public README architecture .env.example
- Demo video 2-3min YouTube
- Live demo Vercel + backend
- Fill all fields
- Emphasize Meta AI usage
- Test early
- List team members

## 13. QUICK COPY-PASTE
Q: What did you build? TraceX AI intelligent blockchain investigation platform that traces crypto transactions across wallets detects suspicious patterns and uses Meta Llama to generate evidence-backed reports with tx citations.

Q: How does it use Meta AI? Uses Llama 3.3 via Meta Model API for explaining trails and Q&A over deterministic graph data with citation enforcement. Built using Meta AI desktop and Muse Code.

Q: Impact? Makes investigations accessible to 400M+ crypto users indie devs exchanges who cannot afford Chainalysis. Critical in emerging markets.

Q: Technical depth? Combines multi-source blockchain aggregation BFS graph building with loop avoidance Python NetworkX heuristics and Llama reasoning pipeline with evidence grounding. Real-time React Flow viz.

Good luck!
