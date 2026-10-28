# TraceX AI — Hackathon Submission Draft

**Event:** [Meta Global AI Developer Hackathon](https://cerebralvalley.ai/e/meta-ai-developer-hackathon)
**Track:** Indie developer
**Theme:** Build for Your World
**Project:** TraceX AI
**Builder:** Okokoh Benjamin

The public event page describes the indie developer track as judging creativity, technical ambition, and whether the project works. The event page lists submissions due November 4, 2026 at 9:00 PM ET. Recheck the event page and submission portal before submitting; schedules can change.

## Project description

TraceX is a read-only blockchain investigation tool for people who need to check a wallet or understand where a transfer went. It turns supported on-chain transfers into a graph, runs deterministic pattern checks, and uses Meta's Muse Spark through the Meta Model API to explain the resulting evidence in plain language. Its Wallet Shield also checks recent indexed history for address-poisoning patterns, including lookalike addresses and unverified tokens.

Paste a transaction hash, wallet address, or ENS name to start a trace. Or open Wallet Shield and scan a wallet on a supported chain. The interface links findings to the underlying transaction or address so a person can verify the record rather than rely on an unexplained score. For a live trace, Recovery Kit can draft an exchange preservation request and a police incident report in English, Nigerian Pidgin, Igbo, Yoruba, or Hausa.

## What is implemented

- Seven EVM networks: Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon, and Robinhood Chain.
- A breadth-first, forward-in-time transfer graph with loop avoidance, a configurable hop limit up to 20, and a 40-node cap.
- Alchemy as the recommended data source, with Etherscan V2 and selected keyless explorers as alternatives.
- Deterministic detectors for mixer interactions, peel chains, fast movement, exchange interactions, and bridge transfers. The Python analysis service can be configured; the backend has a TypeScript fallback.
- A Muse Spark explanation path through the Meta Model API. The prompt asks the model to stay grounded in the graph and findings. This is not a guarantee against model errors; citations are clickable only when they match a transaction or address present in the case.
- An interactive graph, evidence and timeline panels, follow-up questions, JSON export, and a printable report that can be saved as PDF from the browser.
- A read-only address-poisoning scan for recent Alchemy-indexed transfers. The interface reports scan limits and warns that a clean scan is not a guarantee of safety.
- A Recovery Kit tab that generates editable exchange and police-report drafts from a trace. It requires the Meta Model API and a live case; the backend re-runs the requested trace server-side, requires each draft to cite a transaction in that authoritative case, and rejects addresses not present in its graph. The user must verify and send the drafts themselves.

## Planned, not implemented

- Automatic cross-chain follow-through is not available yet. The initial proposed scope is Ethereum L1 bridge transfers to Base, Optimism, and Arbitrum. Do not present this as a working feature until canonical bridge event matching, destination-chain continuation, and chain-specific graph links have been implemented and tested.

## Why this problem

Crypto explorers expose raw transfers, but a person trying to verify a recipient or follow suspicious funds still has to connect addresses, transactions, and timing manually. TraceX is designed to make that first review more understandable and verifiable, including for users who cannot rely on enterprise investigation software.

The project is grounded in the builder's context in Enugu, Nigeria. The submission should describe personal experience only if the builder is comfortable confirming it in their own words.

## Meta AI use

The application calls Muse Spark through the Meta Model API for the case brief and questions. The backend sends the trace graph and deterministic findings rather than asking the model to discover blockchain facts independently. The prompt requests transaction citations, and the UI links any matching hashes back to evidence in the graph.

The code also includes optional Fireworks and Baseten explanation providers. They are fallbacks, not required for the default demo; only claim a provider was used or tested if it was configured and exercised. The Python/NetworkX analysis engine is also optional at runtime and can be connected through `ANALYSIS_ENGINE_URL`.

## Demo and links

- **Repository:** https://github.com/ekumahost/TraceX
- **Live demo:** Not published yet. Add a verified public URL here after deployment.
- **Demo video:** Add the recording URL after it has been uploaded.
- **Event:** https://cerebralvalley.ai/e/meta-ai-developer-hackathon

## Submission-day checks

1. Run a live trace and Wallet Shield scan from the deployed site; confirm the data source and engine shown in the UI.
2. Verify the transactions and labels in the relevant block explorer before narrating them.
3. Use the synthetic sample only when it is visibly labelled as sample data.
4. Confirm the model provider shown in the brief, and describe unconfigured providers as optional code only.
5. Test the printable report and JSON export, including on a phone-sized viewport.
6. Replace the live-demo and video placeholders only with working public links.

## Known limitations to disclose

- Traces are bounded by the hop and node caps and follow only supported native assets and selected tokens.
- Address labels and known-entity coverage vary by chain.
- Wallet Shield scans a bounded amount of Alchemy-indexed history; it does not prove a wallet is safe or malicious.
- Recovery Kit output is model-generated and requires human verification. Citation checks constrain hashes and addresses to the submitted trace, but do not validate translation quality or guarantee the draft is suitable for a particular exchange or police agency.
- The case score is a rule-based indicator, not a probability of crime or a legal conclusion.
- AI output can be wrong. Check its citations and claims against the source transactions.
- The app does not currently store investigations or provide authenticated accounts.
