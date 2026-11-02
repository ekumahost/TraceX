# TraceX Demo Script — 2:57 (as recorded)

**Goal:** Show one complete, honest user journey that demonstrates creativity, technical ambition, and a working product—the public criteria for the indie developer track.

Before recording, confirm that the backend, data-provider key, and Meta Model API key work; choose a real address-poisoning scan with a verified finding; verify every displayed transaction in its explorer; and prepare the sample case as a fallback. Never present sample data as live.

If RPC or API access is unavailable, choose one of the labelled offline synthetic traces from the investigation form. Its graph and deterministic reply run locally; do not describe fixture addresses or hashes as real.

## Shot list (final cut, 2 Nov 2026)

Narrated by the builder; recorded from the live app by [`tools/demo-video`](../tools/demo-video) on the real case in [`demo-cases.md`](demo-cases.md). Captions: `demo-output/TraceX-Demo-Live.srt`.

| Time | Scene | What is on screen |
|---|---|---|
| 0:00 | Builder intro (on camera) | Okokoh Benjamin, built in Enugu: people lose money to crypto scams and cannot trace it |
| 0:11 | Landing | "TraceX changes that" - AI-powered blockchain forensics |
| 0:22 | Paste | The 28 Oct transaction, found on Ethereum without choosing a chain (7 chains searched) |
| 0:39 | Graph | 600 ETH into Tornado Cash in six 100 ETH deposits; Python/NetworkX detectors on Modal; score 70 |
| 1:03 | AI brief | Muse Spark via the Meta Model API; clicking a citation jumps to the transfer and its explorer link |
| 1:23 | Ask | "Did these funds touch a mixer?" answered with citations |
| 1:31 | Model choice | The same brief re-written by Muse Spark Open via Fireworks AI, then via Baseten; back to Auto (automatic fallback) |
| 1:45 | Recovery Kit | Exchange preservation request + police report drafted in Igbo; drafts that invent a wallet or skip a transaction are rejected |
| 2:16 | Poisoning Shield | Two look-alike senders and a fake "ETH" token for the same 600 ETH |
| 2:40 | Close | Open source; Next.js/TypeScript, Python on Modal, Muse Spark, 7 chains via Alchemy, tests; Built in Enugu |

To rebuild: see [`tools/demo-video/README.md`](../tools/demo-video/README.md).
