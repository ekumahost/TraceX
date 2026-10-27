# TraceX AI — AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence.

**Built for the Meta AI Developer Hackathon 2026** — https://cerebralvalley.ai/e/meta-ai-developer-hackathon

> This project is an official submission to the Meta Global AI Developer Hackathon 2026 (Cerebral Valley), competing for the $1M prize pool. Built with Meta AI products: Muse Spark / Llama 3.3, Meta AI, Muse Code, Muse Image, and open-weight models.

![Meta AI Hackathon](https://img.shields.io/badge/Meta%20AI%20Hackathon-2026-blueviolet?style=for-the-badge) ![Built with Llama](https://img.shields.io/badge/Built%20with-Llama%203.3-6d5bff?style=for-the-badge) ![Muse Code](https://img.shields.io/badge/Muse%20Code-Agentic-00e5ff?style=for-the-badge)

## Vision
Trace crypto transactions, investigate suspicious fund movements, and understand where money goes on-chain — with evidence-backed AI.

TraceX combines deterministic blockchain data retrieval + graph analysis + Meta AI interpretation to produce transparent, citable investigation reports.

## Hackathon Submission Info
- **Event:** Meta AI Developer Hackathon 2026 - https://cerebralvalley.ai/e/meta-ai-developer-hackathon
- **Track:** Indie Developer Track
- **Theme:** Build for Your World
- **Folder:** /Applications/WEBSITE/TraceX
- **Docs:** docs/requirements.md, docs/technical-design.md, docs/hackathon-submission.md

## Quick Start
The project structure lives in /Applications/WEBSITE/TraceX

Docs are in docs/ folder:
- requirements.md - Vision + use cases
- technical-design.md - Architecture + stack
- hackathon-submission.md - All answers for submission day + feedback on Meta products
- meta-feedback.md - Answer for "Provide feedback from your experience using Meta products"

Application is in application/ folder:
- frontend/ - Next.js 14 amazing investigative UI (React Flow + Tailwind)
- backend/ - TypeScript API
- analysis-engine/ - Python FastAPI + NetworkX heuristics

## Stack
- Frontend: Next.js 14 + TypeScript + Tailwind + shadcn + React Flow + Framer Motion
- Backend: Express TypeScript
- Analysis: Python FastAPI + NetworkX + web3.py
- Blockchain: Alchemy + Etherscan + Covalent
- AI: Meta Model API - Muse Spark / Llama 3.3-70B (evidence-backed reasoning with tx citations), Meta AI, Muse Code, Muse Image
- DB: Postgres + Redis + Neo4j (Phase 2)
- Infra: Docker Compose, Vercel, Fly.io

## Why TraceX for Meta Hackathon?
Impact (30%): Makes investigations accessible to 400M+ crypto users who cannot afford Chainalysis, critical in emerging markets.
Meta AI Tooling (25%): Multi-model pipeline - deterministic graph JSON -> heuristics -> Llama reasoning with citation enforcement to prevent hallucination. Built entirely with Meta AI desktop + Muse Code.
Demo (25%): Interactive graph + AI explanation + PDF export.
Technical Depth (20%): BFS fund tracing, multi-source aggregation, NetworkX heuristics, React Flow visualization.

## Run Locally
See application/README.md for full setup, including **setting the AI API keys** (required for Llama explanations). Quick:
```
cd application/frontend && node generate-package.js && npm install && npm run dev
cd ../backend && node generate-package.js && npm install && npm run dev
cd ../analysis-engine && pip install -r requirements.txt && uvicorn app.main:app --reload
```

## Links
- Hackathon: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
- Submission Portal: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit
- Live Demo: [INSERT VERCEL LINK]
- Demo Video: [INSERT YOUTUBE LINK]
- GitHub: [INSERT GITHUB LINK]

Built with ❤️ for Meta AI Developer Hackathon 2026. Let's win.
