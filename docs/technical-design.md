# TraceX — Implemented Architecture

This document describes the current code, not the longer-term product roadmap.

## System overview

```text
Next.js frontend (port 3300)
  ├─ trace, shield, and Recovery Kit requests
  ├─ interactive graph, evidence, and timeline
  └─ report and JSON export
             │
             ▼
Express/TypeScript API (port 4000)
  ├─ read-only chain data providers
  ├─ bounded graph traversal and local transfer cache
  ├─ deterministic analysis (TypeScript fallback)
  ├─ optional FastAPI/NetworkX analysis service
  └─ Muse Spark via Meta Model API (optional Fireworks/Baseten fallbacks)
```

## Frontend

The Next.js 14 App Router frontend is written in TypeScript and styled with Tailwind. React Flow renders the investigation graph. The workspace includes a case summary, graph, AI brief, follow-up questions, evidence panel, and timeline. Wallet Shield is a separate read-only flow for checking recent indexed wallet history.

The report page uses the browser print dialog; users can choose “Save as PDF.” JSON case export is available from the investigation workspace. The sample case is synthetic and labelled in the UI.

## API and chain data

The Express API exposes `/api/chains`, `/api/trace`, `/api/shield`, `/api/recovery-kit`, `/api/explain`, and `/api/ask`. API keys are read by the backend and are not sent to the browser. Per-IP request limits are held in memory for a single backend instance.

The chain adapter supports Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon, and Robinhood Chain. Alchemy is the recommended source; Etherscan V2 and selected keyless explorers can be used as alternatives for traces. Live traces include native assets and a small set of configured tokens, not every token on each network.

The trace builder follows transfers forward in time using breadth-first traversal. It avoids expanding a wallet more than once, stops at labelled entities and contracts, follows up to 20 hops, and caps a case at 40 nodes. Results are therefore bounded views, not complete transaction histories.

Wallet Shield uses Alchemy's transfer API to inspect up to two pages of incoming and outgoing records. It compares transfers against counterparties with verified value activity and reports lookalike addresses, zero-value transfers, and unverified tokens using familiar asset names. The response indicates when Alchemy returned another page beyond the scan limit. The scan does not establish intent or prove a wallet safe.

The Recovery Kit re-runs a live trace on the backend instead of trusting a client-supplied graph, then asks Muse Spark for an exchange-preservation request and police incident-report draft. Drafts are restricted to transaction hashes and addresses in that trace; this does not verify translation quality or make the text legally suitable. The user reviews and sends drafts manually. The sample case is not eligible.

Automatic cross-chain continuation from Ethereum to Base, Optimism, or Arbitrum remains planned and is not implemented.

## Deterministic analysis

The backend runs the TypeScript detectors by default. When `ANALYSIS_ENGINE_URL` is set, it calls the Python FastAPI service, which uses NetworkX; if the service fails, the backend logs the failure and falls back to TypeScript. The Python and TypeScript implementations are checked against shared fixtures.

Detectors look for known mixer interactions, peel-chain-shaped movement, rapid multi-hop activity, exchange interactions, and bridge transfers. The 0–100 case score is derived from rule severities. It is an indicator for the observed graph, not a calibrated probability or legal conclusion. Entity labels are incomplete and vary by chain.

## AI explanation

Muse Spark via the Meta Model API is the default explanation and question-answer provider. Fireworks and Baseten can be configured as optional fallbacks for explanations; Baseten is not used for follow-up Q&A. Provider selection is server-side through `AI_PROVIDER`.

The model receives the graph and deterministic findings and is instructed to stay grounded in them and cite transactions. This instruction is not an enforcement mechanism. The UI links transaction hashes only when they match an edge in the current case, and users should verify the model's claims in the explorer.

## Local development

- Frontend: `cd application/frontend && npm install && npm run dev`
- Backend: `cd application/backend && npm install && npm run dev`
- Python analysis: `cd application/analysis-engine && .venv/bin/uvicorn app.main:api --port 8100`

See [application/README.md](../application/README.md) for environment variables, provider setup, and test commands.

## Current boundaries

- No user accounts, saved investigations, or database-backed case history.
- Graphs and Shield scans are bounded by configured node, hop, and provider-page limits.
- Labels and supported token lists are curated and incomplete.
- Model output can contain unsupported claims; citations and source transactions must be checked.
