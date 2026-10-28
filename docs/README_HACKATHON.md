# TraceX AI

TraceX is a read-only blockchain investigation and wallet-safety app. It turns supported EVM transfers into a bounded graph, runs deterministic pattern checks, and uses Muse Spark through the Meta Model API to explain the evidence. Wallet Shield scans recent indexed history for address-poisoning patterns such as lookalike addresses and unverified tokens. The Recovery Kit can draft exchange and police incident-report documents from a live trace in English, Nigerian Pidgin, Igbo, Yoruba, or Hausa.

Cross-chain follow-through is implemented for canonical Ethereum L1 Standard Bridge transfers to Base and Optimism and Arbitrum One ERC20 gateway deposits, when exactly one matching destination finalization can be found in the bounded lookup window. Arbitrum native-ETH Inbox deposits and withdrawals are not followed.

## Hackathon fit

- **Event:** [Meta Global AI Developer Hackathon](https://cerebralvalley.ai/e/meta-ai-developer-hackathon)
- **Track:** Indie developer
- **Theme:** Build for Your World
- **Public indie-track criteria:** Creativity, technical ambition, and whether the project works.

## Project

- [Main README](../README.md) — setup and project overview.
- [Application guide](../application/README.md) — local run instructions and provider setup.
- [Submission draft](./hackathon-submission.md) — implementation summary, demo links, and limitations.
- [Demo script](./demo-script.md) — recording outline.
- [Demo cases](./demo-cases.md) — prepared cases; verify again before recording.

## Important accuracy notes

- The Meta Model API / Muse Spark integration is the default AI path. Fireworks and Baseten are optional fallback providers; only describe them as tested if they were configured and exercised.
- The Python analysis service is optional and is selected with `ANALYSIS_ENGINE_URL`; otherwise the backend uses its TypeScript implementation.
- Model prompts request evidence-grounded answers but do not guarantee that every generated claim is correct.
- Recovery Kit re-runs the live trace server-side and checks every distinct case transaction hash in both drafts. It does not send documents or validate translation quality.
- Do not describe an unmatched/ambiguous bridge transfer as followed, or show cross-chain behavior without verifying the source and destination transactions in their explorers.
- Scores are deterministic rule-based indicators, not calibrated probabilities.
- Live demo and video links belong here only after they have been published and checked.
