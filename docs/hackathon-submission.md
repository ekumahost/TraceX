# TraceX AI — Hackathon Submission Draft

**Event:** [Meta Global AI Developer Hackathon](https://cerebralvalley.ai/e/meta-ai-developer-hackathon)
**Track:** Indie developer
**Theme:** Build for Your World
**Project:** TraceX AI
**Builder:** Okokoh Benjamin

The public event page describes the indie developer track as judging creativity, technical ambition, and whether the project works. The event page lists submissions due November 4, 2026 at 9:00 PM ET. Recheck the event page and submission portal before submitting; schedules can change.

## Problem statement: Build for Your World

> "Bring Meta's models into your domain. Solve a problem you know firsthand, free up time and mental space, and make something possible that wasn't before."

- **A problem known firsthand:** built in Enugu, where people lose money to crypto scams and have no affordable way to find out where it went.
- **Frees up time and mental space:** hours of explorer work - following wallets one at a time - become a cited graph and a plain-language brief in seconds, and the documents a victim needs are drafted for them.
- **Something possible that wasn't before:** a free exchange preservation request and police incident-report draft, grounded in the on-chain evidence, in Nigerian Pidgin, Igbo, Yoruba or Hausa.
- **Meta's models, as listed in the problem statement:** the **Muse Spark series** through the **Meta Model API**, and the open-weights **Muse Spark Open** run on Fireworks AI and Baseten.

## How TraceX scores on the judging rubric

| Category (weight) | TraceX |
|---|---|
| **Impact (30%)** | Victims of crypto scams in Nigeria and across Africa have no affordable way to follow their money; enterprise tracing tools are priced for agencies. TraceX is free, read-only and works from one pasted hash: it shows where the funds went, flags mixers and cash-outs, warns about address poisoning before you send, and drafts the exchange and police documents a victim needs - in English, Nigerian Pidgin, Igbo, Yoruba or Hausa. Live now at https://trace-x-khaki.vercel.app. |
| **Use of Meta AI tooling (25%)** | Not a single chat call: Muse Spark (Meta Model API) and Meta's open-weights Muse Spark Open (on Fireworks AI and Baseten) sit behind one AI layer with a model picker and automatic fallback. The model only sees deterministic evidence and must cite a transaction for every claim; citations are clickable in the graph. Recovery Kit output is machine-checked - a draft that skips a case transaction or invents a wallet is rejected and regenerated - and is written in five Nigerian languages. Reasoning budget and `reasoning_effort` are tuned for Muse Spark's reasoning tokens. |
| **Technical depth & execution (20%)** | Forward-in-time BFS tracer over 7 EVM chains with loop safety and canonical L1→L2 bridge follow-through; Python/NetworkX detectors deployed on Modal with a parity-tested TypeScript fallback; Poisoning Shield; 32 backend + 8 engine + 13 frontend tests and 4 live mainnet tests; rate limits, CORS lock, no keys in the browser, no placeholder AI text ever. |
| **Demo (25%)** | 2:57 video narrated by the builder (https://youtu.be/UsOnJBtFpOI) on a real 28 Oct 2026 case - 600 ETH into Tornado Cash - recorded from the live app with live model answers, the model switch, an Igbo Recovery Kit and Poisoning Shield. The deployed app runs the same case end to end. |

## Project description

TraceX is a read-only blockchain investigation tool for people who need to check a wallet or understand where a transfer went. It turns supported on-chain transfers into a graph, runs deterministic pattern checks on Modal, and uses Meta's Muse Spark models to explain the resulting evidence in plain language: Muse Spark through the Meta Model API, or Muse Spark Open (Meta's open-weights model) on Fireworks AI or Baseten. Its Wallet Shield also checks recent indexed history for address-poisoning patterns, including lookalike addresses and unverified tokens.

Paste a transaction hash, wallet address, or ENS name to start a trace. Or open Wallet Shield and scan a wallet on a supported chain. The interface links findings to the underlying transaction or address so a person can verify the record rather than rely on an unexplained score. For a live trace, Recovery Kit can draft an exchange preservation request and a police incident report in English, Nigerian Pidgin, Igbo, Yoruba, or Hausa.

## What is implemented

- Seven EVM networks: Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon, and Robinhood Chain.
- A breadth-first, forward-in-time transfer graph with loop avoidance, a configurable hop limit up to 20, and a 40-node cap.
- Alchemy as the recommended data source, with Etherscan V2 and selected keyless explorers as alternatives.
- Deterministic detectors for mixer interactions, peel chains, fast movement, exchange cash-outs, exchange hopping, and bridge transfers. Repeated transfers between the same pair are one finding ("600 ETH across 6 deposits"). The Python/NetworkX engine is **deployed on Modal** (https://ifihear--tracex-analysis-engine-web.us-east.modal.run) and the UI shows "Heuristics · Python · Modal"; an identical TypeScript copy is used if Modal is unreachable, and parity tests keep the two in step.
- **Three Meta-model providers behind one AI layer:** Muse Spark (`muse-spark-1.3`) on the Meta Model API, and Muse Spark Open on **Fireworks AI** (`accounts/fireworks/models/muse-spark-open`) and **Baseten** Model APIs (`meta-models/muse-spark-open`). All three get the same evidence-only prompts and power all three AI features (brief, follow-up questions, Recovery Kit). A model picker in the workspace offers Auto · Muse Spark · Fireworks · Baseten; on Auto, a provider that is down, slow to answer or out of tokens is skipped and the next one answers, and the UI says it switched. `GET /api/providers` reports which providers are configured.
- Prompts ask the model to stay grounded in the graph and findings. This is not a guarantee against model errors; citations are clickable only when they match a transaction or address present in the case.
- An interactive graph, evidence and timeline panels, follow-up questions, JSON export, and a printable report that can be saved as PDF from the browser.
- A read-only address-poisoning scan for recent Alchemy-indexed transfers. The interface reports scan limits and warns that a clean scan is not a guarantee of safety.
- A Recovery Kit tab that generates editable exchange-preservation and police-report drafts from a trace in **English, Nigerian Pidgin, Igbo, Yoruba or Hausa**. It runs on any of the three providers and needs a live case; the backend re-runs the trace server-side, requires each draft to cite **every** transaction in that case, rejects addresses not present in its graph, gives each provider two tries, then switches to the next provider. The exchange is optional: mixer cases get an [EXCHANGE NAME] placeholder. The user must verify and send the drafts themselves.
- Automatic L1-to-L2 follow-through for canonical Ethereum bridge transfers to Base, Optimism, and Arbitrum One. TraceX matches protocol initiation/finalization events and follows the recipient on the destination chain; it does not join based only on amount or time. Graph identities and explorer links are chain-specific.
- Bundled offline demo traces are selectable in the investigation form. They exercise graph, evidence, deterministic reply, and local follow-up UI without a backend, chain RPC, or AI provider. All included addresses and hashes are generated fixtures and must not be presented as real cases.

## Verified real case

On 28 Oct 2026 wallet `0x884f…e79e` received 600.099 ETH (tx `0x08bf5ce46d97ec6299b7a4d1ba9b37591a66c97775186ffd30a1cd023d909b90`) and moved all of it into Tornado Cash's 100 ETH pool in six deposits within five minutes. TraceX traces it in ~6 s (one grouped high-severity finding, score 70); Muse Spark, and Muse Spark Open on Fireworks and on Baseten, each write a cited brief, and Poisoning Shield finds two look-alike senders plus a fake "ETH" token sent for the same amount. The demo video is recorded on this case. Details: `docs/demo-cases.md`.

## Testing

- Backend: 32 unit + HTTP integration tests (validation, error codes, rate limiting, CORS, no-key AI failure, provider order and automatic fallback, poisoning rules, bridge matching, Recovery Kit validation) plus 4 opt-in live tests on the real case above (`npm run test:live`).
- Verified live on 2 Nov 2026: brief, follow-up question and Igbo Recovery Kit on each of the three providers (Meta Model API, Fireworks, Baseten), all citing the case's transactions.
- Analysis engine: 8 pytest tests, including parity with the TypeScript detectors on shared fixtures.
- Frontend: 13 unit tests (scoring parity with the backend, formatting, sample-case integrity, layout).

## Cross-chain boundaries

- Cross-chain matching locates the destination block near the source transaction timestamp, searches a bounded window of up to 100,000 blocks after that point, and follows only a unique matching finalization. Missing, ambiguous, or failed lookups do not create a cross-chain edge; public RPC providers may rate-limit these searches.
- Supported bridges are the OP Stack L1 Standard Bridge for Base and Optimism and Arbitrum One ERC20 gateways. Arbitrum native-ETH Inbox deposits and L2-to-L1 withdrawals are not supported.

## Why this problem

Crypto explorers expose raw transfers, but a person trying to verify a recipient or follow suspicious funds still has to connect addresses, transactions, and timing manually. TraceX is designed to make that first review more understandable and verifiable, including for users who cannot rely on enterprise investigation software.

The project is grounded in the builder's context in Enugu, Nigeria. The submission should describe personal experience only if the builder is comfortable confirming it in their own words.

## Meta AI use

The application calls Muse Spark through the Meta Model API for the case brief and questions. The backend sends the trace graph and deterministic findings rather than asking the model to discover blockchain facts independently. The prompt requests transaction citations, and the UI links any matching hashes back to evidence in the graph.

Muse Spark (`muse-spark-1.3`) is also used for the Recovery Kit drafts in five languages. Because Muse Spark spends reasoning tokens before answering, TraceX sizes the token budget for reasoning plus answer and uses `reasoning_effort: low` (~10-15 s per brief).

The same features run on Meta's open-weights **Muse Spark Open** through two hackathon partners, **Fireworks AI** and **Baseten**, using the same prompts and the same Recovery Kit validation. Users pick the model in the workspace or leave it on Auto, which switches providers automatically when one fails. The deterministic detectors run on the third partner, **Modal**, through `ANALYSIS_ENGINE_URL`.

## Demo and links

- **Repository:** https://github.com/ekumahost/TraceX
- **Live demo:** https://trace-x-khaki.vercel.app (frontend on Vercel; API on Render's free tier at https://tracex-backend-d0il.onrender.com - the first request after ~15 idle minutes takes 30-50 s to wake it, and the UI says so)
- **Demo video (2:57, captioned):** https://youtu.be/UsOnJBtFpOI
- **Event:** https://cerebralvalley.ai/e/meta-ai-developer-hackathon

## Submission-day checks

1. Run a live trace and Wallet Shield scan from the deployed site; confirm the data source and engine shown in the UI.
2. Verify the transactions and labels in the relevant block explorer before narrating them.
3. Use the synthetic sample only when it is visibly labelled as sample data.
4. Confirm `GET /api/providers` on the live API lists all three providers as configured with the Muse Spark models, and that switching the model picker to Fireworks and Baseten shows "via Fireworks AI" / "via Baseten".
5. Test the printable report and JSON export, including on a phone-sized viewport.
6. Replace the live-demo and video placeholders only with working public links.
7. If live network access is unavailable during a presentation, use an offline synthetic demo and clearly identify it as generated demonstration data—not a real fraud wallet or on-chain investigation.

## Known limitations to disclose

- Traces are bounded by the hop and node caps and follow only supported native assets and selected tokens.
- Cross-chain graph continuation is limited to the supported bridge event types and indexed destination lookback; it is not a complete bridge history or proof of common fund ownership.
- Address labels and known-entity coverage vary by chain.
- Wallet Shield scans a bounded amount of Alchemy-indexed history; it does not prove a wallet is safe or malicious.
- Recovery Kit output is model-generated and requires human verification. Citation checks constrain hashes and addresses to the submitted trace, but do not validate translation quality or guarantee the draft is suitable for a particular exchange or police agency.
- The case score is a rule-based indicator, not a probability of crime or a legal conclusion.
- AI output can be wrong. Check its citations and claims against the source transactions.
- The app does not currently store investigations or provide authenticated accounts.
