# TraceX Application
This folder will contain:
- frontend/ - Next.js 14 amazing investigative UI
- backend/ - TypeScript API orchestration
- analysis-engine/ - Python FastAPI deterministic analysis

## Tech Stack
- Frontend: Next.js 14 + TypeScript + Tailwind + shadcn/ui + React Flow
- Backend: NestJS / Next API
- Analysis: Python FastAPI + NetworkX
- Blockchain: Alchemy + Etherscan
- AI: Meta AI API

## Setting AI API Keys
TraceX explains traces with Meta's models: Muse Spark via the Meta Model API, or Llama 3.3 70B via Fireworks / Baseten. The backend needs **at least one** provider key; keys are read on the server only and never sent to the browser.

1. Create your env file:
   ```bash
   cd application/backend
   cp .env.example .env
   ```
2. Open `application/backend/.env` and fill in one or more keys:

   | Variable | Where to get it |
   |---|---|
   | `META_API_KEY` | Meta Model API (Muse Spark) - https://dev.meta.ai → Dashboard → API keys |
   | `FIREWORKS_API_KEY` | Llama 3.3 70B - https://fireworks.ai → Account → API Keys |
   | `BASETEN_API_KEY` + `BASETEN_MODEL_ID` | Llama 3.3 70B - https://app.baseten.co → deploy Llama 3.3 70B Instruct, then API Keys |

3. Optional: set `AI_PROVIDER` to `meta`, `fireworks` or `baseten` to choose which is tried first. The others are used as fallbacks.
4. Restart the backend (`npm run dev`). Docker Compose picks up the same `backend/.env` automatically.

Check it works:
```bash
curl -X POST http://localhost:4000/api/explain \
  -H 'content-type: application/json' \
  -d '{"graph":{"nodes":[],"edges":[]},"heuristics":[]}'
```
A `{"provider":"meta","text":"..."}` response means it's working. A `502` lists which keys are missing.

**Never commit `.env`.** Make sure the repo's ignore file is named `.gitignore` (not `gitignore.txt`).

## Running the app locally
```bash
# terminal 1 - backend API on http://localhost:4000
cd application/backend && npm install && npm run dev

# terminal 2 - frontend on http://localhost:3300
cd application/frontend && npm install && npm run dev
```
Open http://localhost:3300 and click **Sample case** (or go to `/investigate?q=sample`).
If the backend runs somewhere else, set `NEXT_PUBLIC_API_URL` in `application/frontend/.env.local`.
Paste a tx hash, wallet address or ENS name to run a live trace. Pick the chain next to the
search box - Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon or Robinhood Chain. With "Auto chain", a tx
hash is looked up on every chain automatically and wallets default to Ethereum.

## Blockchain data
Live traces follow each chain's native coin (ETH, BNB, POL) plus its main stablecoins and wrapped
native token (token lists in `backend/src/services/chains.ts`, verified on-chain with
`cd application/backend && npx tsx scripts/check-chains.ts`) forward in time from the starting point
(largest 4 transfers per wallet, up to 40 wallets), stopping at exchanges, mixers, bridges and contracts.

Data comes from the first of these that is configured in `application/backend/.env`:
1. `ALCHEMY_API_KEY` - free at https://dashboard.alchemy.com. One key covers all seven chains
   (enable each network on your Alchemy app's Networks page). **Recommended.**
2. `ETHERSCAN_API_KEY` - free at https://etherscan.io/myapikey. One V2 key covers many chains,
   including BNB Chain; check Etherscan's plans page for which chains the free tier includes.
3. Free keyless explorers - Ethereum (Blockscout, Routescan) and Optimism (explorer.optimism.io) only.
   Slow and quickly rate-limited; the other chains have no keyless option.

Alchemy also replaces the free public RPC nodes, which can't look up older transactions.

If a live trace fails, the app shows the labelled sample case and the reason.

## Analysis engine (Python + NetworkX, on Modal)
The detectors (mixer, peel chain, velocity, exchange cash-out and hopping, bridge) and the
0-100 case score run in `application/analysis-engine`. The backend calls it when
`ANALYSIS_ENGINE_URL` is set and falls back to its built-in TypeScript copy otherwise, so a
trace never fails because the engine is down. The UI shows which engine ran.

```bash
cd application/analysis-engine
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest                       # includes a parity test against the TypeScript detectors
.venv/bin/uvicorn app.main:api --port 8100       # local engine -> ANALYSIS_ENGINE_URL=http://localhost:8100

# deploy to Modal (serverless, scales to zero)
.venv/bin/modal setup                            # one-time browser login
.venv/bin/modal deploy modal_app.py              # prints https://<you>--tracex-analysis-engine-web.modal.run
```
Put the deployed URL in `application/backend/.env` as `ANALYSIS_ENGINE_URL` and restart the backend.
If you change the detectors, update both copies and regenerate the parity fixtures:
`cd application/backend && npx tsx ../analysis-engine/tests/export_fixture.ts`.
