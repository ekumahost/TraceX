# TraceX Demo Script — 2 Minutes

**Goal:** Show one complete, honest user journey that demonstrates creativity, technical ambition, and a working product—the public criteria for the indie developer track.

Before recording, confirm that the backend, data-provider key, and Meta Model API key work; choose a real address-poisoning scan with a verified finding; verify every displayed transaction in its explorer; and prepare the sample case as a fallback. Never present sample data as live.

If RPC or API access is unavailable, choose one of the labelled offline synthetic traces from the investigation form. Its graph and deterministic reply run locally; do not describe fixture addresses or hashes as real.

## 0:00–0:15 — The problem

**Show:** TraceX landing page.

**Say:** “When you check a crypto recipient or investigate a suspicious transfer, an explorer gives you records, not an explanation. TraceX helps connect those records into a trail you can inspect—and checks for copycat addresses planted in a wallet’s history.”

## 0:15–0:40 — Wallet Shield

**Show:** Open Wallet Shield, enter the prepared wallet and chain, and run the scan.

**Say:** “This scan compares recent indexed transfers with counterparties that moved verified value with this wallet. It flags possible lookalikes, zero-value transfers, and unverified tokens. These are warning signals, not proof of intent. Here’s the matching transaction and the full address in the explorer.”

If there are no findings, say that the scan found no matches in the history it inspected. Do not call the wallet safe.

## 0:40–1:20 — Trace and verify

**Show:** Run the prepared transaction trace. Point out the data source, graph, hop-by-hop transfers, and deterministic findings. Open an evidence citation, then show the AI brief.

**Say:** “For a transaction or wallet, TraceX builds a bounded, loop-safe graph from supported on-chain transfers. The rules engine identifies patterns before the model sees the case. Muse Spark receives that graph and those findings and is asked to explain them with transaction references. I can click a matching citation to inspect the transfer; the score is a rule-based indicator, not a probability.”

Only state a detector result if it appears in the verified case. If the AI brief is unavailable, show the rule-based summary and explain the limitation rather than implying AI succeeded.

## 1:20–1:42 — Show the engineering

**Show:** Evidence/timeline panels, then the architecture diagram.

**Say:** “The app supports seven EVM networks, bounded graph traversal, and deterministic analysis in TypeScript with an optional Python/NetworkX service. The Meta Model API is the default explanation path. Optional inference providers are available in code, but this demo uses the provider named in the interface.”

## 1:42–2:00 — Close

**Show:** Printable report, then the project and event links.

**Say:** “TraceX is a practical tool for checking recipients and making on-chain trails easier to understand and verify. It is read-only, and it keeps the underlying transactions visible so people can check the explanation for themselves. Built for the Meta Global AI Developer Hackathon, under Build for Your World.”

## Optional — Cross-chain follow (if a verified live bridge case is prepared)
**Show:** Open a trace with a supported Ethereum L1 bridge initiation that has a unique Base, Optimism, or Arbitrum One L2 finalization in the indexed window. Point out the chain badges, confirmed continuation edge, and separate explorer links for the source and destination transactions.

- Use a transaction verified on both explorers; do not imply that a cross-chain edge proves common ownership or complete fund provenance.
- If the app reports an unmatched or failed lookup, explain the bounded provider window/rate limit rather than presenting it as a confirmed destination.
- Arbitrum native-ETH Inbox deposits and L2-to-L1 withdrawals are not in the current supported scope.

## Recording checklist

- Use a verified live case and keep its explorer page ready.
- Confirm Wallet Shield's result, chain, provider coverage, and any scan-limit warning before recording.

## Recovery Kit (only with a verified live case and working Meta API key)
**Show:** Open Recovery Kit in the investigation workspace, select an exchange and language, generate the two drafts, and point out that they are editable and are never sent by TraceX.

- Use a live trace with real transaction evidence; the app disables generation for sample data.
- Verify the cited transactions in the block explorer before recording.
- Show cross-chain follow only with a verified live bridge case; otherwise omit it rather than implying it was exercised.
- Confirm the AI provider shown in the brief and avoid untested performance claims.
- If live services fail, switch to the visibly labelled sample and say that it is synthetic.
- Test browser print-to-PDF and JSON export.
- Do not show credentials, `.env` files, or private account data.
