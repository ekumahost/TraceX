# TraceX AI - Build Timeline - Oct 27 to Nov 4 Submission
Builder: Okokoh Benjamin
Hackathon: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
Deadline: Nov 4, 2026 - 9pm ET (Nov 5, 2am WAT Nigeria)
Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026.

## Status - updated Wed Oct 28

### Done
| Area | What works | Where |
|---|---|---|
| Git | Pushing to https://github.com/ekumahost/TraceX `main` over SSH | - |
| UI | BoxLife-style landing page (Adinkra logo, Kente/Adire patterns, "Built in Enugu") and investigation workspace: graph built hop by hop, risk gauge, flags, AI brief with clickable tx citations, Ask, Evidence, Timeline, JSON export, chain picker | `application/frontend` |
| Fetcher | Live tracing on **7 chains**: Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon, Robinhood Chain. Tx hash, wallet or ENS. Breadth-first, forward in time, loop-safe, 40-wallet cap. Tx hashes are found on the right chain automatically. Token lists verified on-chain | `backend/src/services` |
| Data sources | Alchemy (all 7 chains, key set) → Etherscan V2 (key not yet set) → keyless explorers (Ethereum, Optimism) | `sources.ts`, `chains.ts` |
| Detectors | Mixer, peel chain, high velocity, exchange cash-out, exchange hopping, bridge + 0-100 case score | `analysis-engine/app/heuristics.py` |
| Modal | Python/NetworkX engine **deployed**: https://ifihear--tracex-analysis-engine-web.us-east.modal.run. Backend falls back to a TypeScript copy if Modal is down; parity tests prove both agree | `analysis-engine/modal_app.py` |
| Meta AI | **Muse Spark via Meta Model API working** (key set): AI brief ~15s, Q&A ~5s, cites tx hashes | `backend/src/lib/meta.ts` |
| Docs | API key setup, run steps, engine/Modal setup in `application/README.md`; Modal section of submission doc | - |

### Not done yet
1. **PDF report** - export is JSON only today (was Day 5).
2. **Deploy** - frontend (Vercel) and backend (Render/Railway/Fly) are local only. Backend has no Dockerfile yet. Live demo link in the submission doc doesn't exist yet.
3. **Labels on non-Ethereum chains** - exchange/mixer/bridge detection relies on known-address labels. Ethereum has a seed list plus Blockscout tags; the other 6 chains have no labels yet, so cash-outs and mixers there mostly show as plain wallets. Needs per-chain seed lists (major exchange hot wallets, bridges).
4. **Demo cases** - pick and test 2 real cases (one clean, one suspicious) that trace well. Live traces take ~7-20s, not <3s.
5. **Fireworks / Baseten** - code exists but no keys, so never tested. Either add keys and test, or describe them as optional fallbacks in the submission.
6. **Submission doc accuracy pass** - still says "Location: Port Harcourt" (site says Enugu); "Llama 3.3 via Meta Model API" (it serves Muse Spark); mentions Covalent, Redis, Postgres and "<1 sec" Fireworks responses that aren't built/measured; doesn't mention multi-chain yet.
7. **Polish** - rate limiting (free tier), new-search box on mobile workspace, README badges, LICENSE (MIT), updated architecture diagram, make repo public.
8. **Uncommitted files** - `docs/demo-script.md`, `docs/timeline.md`, `docs/architecture-diagram.svg`, `docs/integrations-fireworks-modal-baseten.md`, `docs/meta-feedback.md` edits, `push.sh`.
9. **Demo video** and **submission portal**.

## Remaining plan

### Today - Wed Oct 28 - Labels + demo cases + honest docs
- Per-chain seed labels: major exchange hot wallets and bridges on Base, BNB, Arbitrum, Optimism, Polygon, Robinhood (each address verified)
- Find 2 real demo cases (clean + suspicious), trace them end to end, save the hashes
- Submission doc accuracy pass (item 6) + add multi-chain and Robinhood Chain
- Commit the uncommitted docs

### Thu Oct 29 - PDF report
- Evidence report: case summary, score, flags with tx hashes, graph image, transfer table, AI brief, sample/live label
- Export button offers PDF + JSON

### Fri Oct 30 - Deploy
- Backend Dockerfile + deploy (Render/Railway/Fly) with env vars; restrict CORS to the frontend URL
- Frontend to Vercel with `NEXT_PUBLIC_API_URL`
- Simple per-IP rate limit on `/api/trace` and the AI endpoints
- Test the live URLs from a phone and an incognito window

### Sat Oct 31 - Polish + repo
- Optional: Fireworks key so the fallback is real and tested
- Mobile search in workspace, loading/error states pass
- README (badges, screenshots, live link), LICENSE MIT, updated architecture diagram showing Modal + Meta Model API + 7 chains
- Make repo public

### Sun Nov 1 - Demo video (most important)
- Follow `docs/demo-script.md`: hook → paste suspicious case → graph builds → flags → Muse Spark brief with citations → Ask → evidence → architecture (Modal, Meta Model API, multi-chain) → impact
- Record, caption, upload unlisted to YouTube

### Mon Nov 2 - Buffer
- Re-record or fix anything the video exposed; spare day for slippage

### Tue Nov 3 - Portal + final test
- Fill the portal from `docs/hackathon-submission.md` and the feedback field from `docs/meta-feedback.md`
- Test every link (live demo, GitHub, video) from incognito and mobile

### Wed Nov 4 - Submit
- Submit by 8pm ET (1am WAT) - one hour buffer before the 9pm ET deadline
- Then share on X / LinkedIn

## Keys (application/backend/.env - never commit)
| Key | Status | Used for |
|---|---|---|
| `META_API_KEY` | set ✅ | Muse Spark AI brief + Q&A |
| `ALCHEMY_API_KEY` | set ✅ (all 7 networks enabled) | Chain data on all chains |
| `ANALYSIS_ENGINE_URL` | set ✅ (Modal) | Detectors + case score |
| `ETHERSCAN_API_KEY` | empty - key page was down | Backup chain data |
| `FIREWORKS_API_KEY` | empty | Optional Llama 3.3 fallback |
| `BASETEN_API_KEY` / `BASETEN_MODEL_ID` | empty | Optional Llama 3.3 fallback |
