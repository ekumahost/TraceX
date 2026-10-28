# TraceX AI — Trace cryptocurrency flows, inspect wallet-safety signals, and verify on-chain evidence.

Built for the [Meta Global AI Developer Hackathon 2026](https://cerebralvalley.ai/e/meta-ai-developer-hackathon).

![Meta AI Hackathon](https://img.shields.io/badge/Meta%20AI%20Hackathon-2026-blueviolet?style=for-the-badge) ![Muse Spark](https://img.shields.io/badge/AI-Muse%20Spark-6d5bff?style=for-the-badge)

## Vision
Trace cryptocurrency transfers, investigate suspicious fund movements, and inspect possible address-poisoning attempts with evidence links.

TraceX combines on-chain data retrieval, bounded graph analysis, deterministic heuristics, and a Meta Model API explanation path. Model prompts ask for evidence-grounded explanations; reviewers should verify generated claims against linked on-chain records.

## Hackathon Submission Info
- **Event:** Meta AI Developer Hackathon 2026 - https://cerebralvalley.ai/e/meta-ai-developer-hackathon
- **Track:** Indie developer
- **Theme:** Build for Your World
- **Folder:** /Applications/WEBSITE/TraceX
- **Docs:** docs/hackathon-submission.md, docs/demo-script.md, docs/technical-design.md

## Quick Start
The project structure lives in /Applications/WEBSITE/TraceX

Docs are in docs/ folder:
- requirements.md - Vision + use cases
- technical-design.md - Architecture + stack
- hackathon-submission.md - Implementation summary, limitations, and submission-day checks
- meta-feedback.md - Personal feedback draft; verify and personalize before submitting

Application is in application/ folder:
- frontend/ - Next.js 14 amazing investigative UI (React Flow + Tailwind)
- backend/ - TypeScript API
- analysis-engine/ - Python FastAPI + NetworkX heuristics
- Wallet Shield - read-only scan of recent indexed transfers for poisoning patterns
- Recovery Kit - generates editable, citation-checked exchange and police-report drafts in English, Nigerian Pidgin, Igbo, Yoruba, or Hausa; never sends them
- Cross-chain follow - planned Ethereum-to-Base, Optimism, and Arbitrum bridge tracing; not yet implemented

## Safety features and status
- **Poisoning Shield (available):** scans a bounded amount of Alchemy-indexed wallet history for look-alike counterparties, zero-value transfers, and unverified-token activity. It reports scan coverage and links evidence; a clean scan is not proof of safety.
- **Recovery Kit (available):** asks Muse Spark for editable exchange-preservation and police incident-report drafts using trace evidence. The API checks that each draft cites a transaction in the case and rejects unrecognized addresses. Review all generated text; it is not legal advice and TraceX does not send requests.
- **Cross-chain follow (planned):** the intended first scope is canonical Ethereum L1 bridge transfers to Base, Optimism, or Arbitrum. This is not currently available, and no cross-chain graph or automatic destination-chain tracing is claimed.

## Stack
- Frontend: Next.js 14 + TypeScript + Tailwind + shadcn + React Flow + Framer Motion
- Backend: Express TypeScript
- Analysis: Python FastAPI + NetworkX + web3.py
- Blockchain: Alchemy recommended; Etherscan V2 and selected keyless explorers are alternatives
- AI: Muse Spark via Meta Model API by default; Fireworks and Baseten are optional fallback providers
- Storage: investigations are computed on demand; the app does not currently save user cases to a database
- Infra: Docker Compose, Vercel, Fly.io

## Hackathon fit
The public event page describes the indie developer track in terms of creativity, technical ambition, and whether the project works. TraceX focuses on a concrete wallet-safety and investigation workflow, bounded graph traversal, deterministic analysis, and a working user-facing demo. No unofficial judging percentages or impact estimates are claimed.

## Run Locally
See [application/README.md](./application/README.md) for provider setup and full instructions. Run the frontend and backend in separate terminals:
```
cd application/frontend && npm install && npm run dev
cd application/backend && npm install && npm run dev
```

The optional Python analysis service can be started separately:
```
cd application/analysis-engine
pip install -r requirements-dev.txt
uvicorn app.main:api --reload --port 8100
```

## Links
- Hackathon: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
- Submission Portal: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit
- Live Demo: not published yet
- Demo Video: not published yet
- GitHub: https://github.com/ekumahost/TraceX

Built for the Meta AI Developer Hackathon 2026.
