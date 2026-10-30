# TraceX AI - Build Timeline - Oct 27 to Nov 4 Submission
Builder: Okokoh Benjamin
Hackathon: https://cerebralvalley.ai/e/meta-ai-developer-hackathon
Deadline: Nov 4, 2026 - 9pm ET (Nov 5, 2am WAT Nigeria)
Tagline: AI-powered blockchain forensics that traces cryptocurrency flows, investigates suspicious transactions, and turns on-chain data into evidence-backed intelligence. Built for the Meta AI Developer Hackathon 2026.

## Status - updated Fri Oct 30 · **code complete, submission-ready once the video is uploaded**

### Done
| Area | What works | Where |
|---|---|---|
| Git | `main` on https://github.com/ekumahost/TraceX (public) | - |
| UI | BoxLife-style landing (Adinkra logo, Kente/Adire, "Built in Enugu"), investigation workspace (graph, score, flags, cited AI brief, Ask, Evidence, Timeline, Recovery), mobile search, printable report | `application/frontend` |
| Tracing | 7 chains (Ethereum, Base, BNB, Arbitrum, Optimism, Polygon, Robinhood); tx auto-detect; internal transfers; canonical bridge follow L1 → Base/Optimism/Arbitrum; top destinations per wallet | `backend/src/services` |
| Labels | Exchange hot-wallet EOAs on all chains + per-chain bridges, each checked against Etherscan labels | `labels.ts` |
| Detectors | Mixer, peel chain, velocity, exchange cash-out, exchange hopping, bridge; grouped findings; floor-based score | Python on **Modal** (deployed) + TS fallback |
| Meta AI | Muse Spark via Meta Model API: brief, Q&A, Recovery Kit drafts in 5 languages; citation validation + retries | `backend/src/lib/meta.ts` |
| New features | **Poisoning Shield** (`/shield`), **Recovery Kit** (EN, Pidgin, Igbo, Yoruba, Hausa), **Cross-chain follow** | - |
| Report | Evidence report → Save as PDF; JSON export | `/report` |
| Deploy prep | Backend + engine Dockerfiles, `render.yaml`, CORS allowlist, per-IP rate limits, no database needed | - |
| Tests | Backend 26 unit+integration + 4 live; Python 8 (parity); frontend 13 - all passing locally | `npm test`, `pytest` |
| CI | `.github/workflows/ci.yml` written - **blocked: GitHub account billing lock** | GitHub settings |
| Demo cases | Real Tornado Cash case with address poisoning; clean case; Robinhood case | `docs/demo-cases.md` |
| Video | **2:58 narrated live demo, real case, cursor + click ripples, captions** - `demo-output/TraceX-Demo-Live.mp4` + `.srt`; reproducible via `tools/demo-video` | not uploaded yet |
| Docs | README rewritten for judges (screenshots, architecture, tests); submission doc accuracy pass; Enugu everywhere | `README.md`, `docs/` |

### Left (all need you)
1. **Upload the video** to YouTube (unlisted is fine), add the `.srt` captions, paste the link into `README.md` and `docs/hackathon-submission.md`. Optional: re-record the narration in your own voice (`tools/demo-video/README.md`).
2. **Fix GitHub billing** (Settings → Billing and plans) so CI runs and can show a green badge.
3. **Optional live demo:** deploy the backend on Render (`render.yaml`) and the frontend on Vercel. The public event page doesn't say a live URL is required; video + public repo may be enough.
4. **Personalise** `docs/meta-feedback.md` in your own words, then fill the portal and submit.

## Remaining plan

### ✅ Wed Oct 28 - Labels + demo cases + honest docs
- Per-chain seed labels: major exchange hot wallets and bridges on Base, BNB, Arbitrum, Optimism, Polygon, Robinhood (each address verified)
- Find 2 real demo cases (clean + suspicious), trace them end to end, save the hashes
- Submission doc accuracy pass (item 6) + add multi-chain and Robinhood Chain
- Commit the uncommitted docs

### ✅ Thu Oct 29 - PDF report
- Evidence report: case summary, score, flags with tx hashes, graph image, transfer table, AI brief, sample/live label
- Export button offers PDF + JSON

### ◐ Fri Oct 30 - Deploy (code ready: Dockerfiles, render.yaml, rate limits, CORS - actual deploy needs your Render/Vercel accounts)
- Backend Dockerfile + deploy (Render/Railway/Fly) with env vars; restrict CORS to the frontend URL
- Frontend to Vercel with `NEXT_PUBLIC_API_URL`
- Simple per-IP rate limit on `/api/trace` and the AI endpoints
- Test the live URLs from a phone and an incognito window

### ✅ Sat Oct 31 - Polish + repo (done early; Fireworks skipped - optional)
- Optional: Fireworks key so the fallback is real and tested
- Mobile search in workspace, loading/error states pass
- README (badges, screenshots, live link), LICENSE MIT, updated architecture diagram showing Modal + Meta Model API + 7 chains
- Make repo public

### ✅ Sun Nov 1 - Demo video (done Oct 30 - upload to YouTube left)
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
