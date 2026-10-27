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

# terminal 2 - frontend on http://localhost:3000
cd application/frontend && npm install && npm run dev
```
Open http://localhost:3000 and click **Sample case** (or go to `/investigate?q=sample`).
If the backend runs somewhere else, set `NEXT_PUBLIC_API_URL` in `application/frontend/.env.local`.
Until the on-chain fetcher is built, every search opens the labelled sample case.
