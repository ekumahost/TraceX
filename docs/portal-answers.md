# Submission portal answers

Ready to paste. Written in the builder's voice - read each one and change anything that isn't true for you before submitting. Links: live app https://trace-x-khaki.vercel.app · video https://youtu.be/UsOnJBtFpOI · code https://github.com/ekumahost/TraceX

## 1. Describe your use of Meta products to build the submitted project.

TraceX runs on four Meta models, all doing real work in the product:

- **Muse Spark (Meta Model API)** writes the investigation brief and answers follow-up questions. It only sees the traced graph and the deterministic findings, and it must cite a transaction hash for every claim; every citation is clickable and jumps to that transfer.
- **Muse Spark** also drafts the **Recovery Kit** - an exchange records-preservation request and a police incident report - in English, Nigerian Pidgin, Igbo, Yoruba or Hausa. TraceX checks every draft: one that skips a transaction in the case or mentions a wallet that isn't in it is rejected and regenerated.
- **Muse Spark vision** powers **screenshot to trace**: a victim uploads a screenshot of their exchange withdrawal or the scammer's chat, Muse Spark reads the hashes and addresses, and TraceX confirms each one on-chain before tracing.
- **Muse Voice Transcribe** lets a victim **speak** what happened in their own language; the transcript goes into the police report as their own, clearly unverified account.
- **Muse Spark Open**, Meta's open-weights model, runs the same brief, Q&A and Recovery Kit on **Fireworks AI** and **Baseten**. Users pick the model, or leave it on Auto and TraceX switches provider by itself if one fails.

I also used the Meta AI app to start the project - the first architecture, scaffolding and Meta Model API integration.

## 2. Why are Meta's models important to your solution?

Blockchain data is public, but reading it is not. A scam victim in Enugu sees a list of hex strings; an investigator needs hours to follow the money; the tools that automate it are priced for agencies. Meta's models are what turn TraceX's evidence into something a victim can understand and act on.

Muse Spark explains a case in plain language while staying tied to the evidence - its reasoning plus our citation checks mean every claim points to a real transaction. It writes the documents a victim actually needs, in the languages they actually speak: Pidgin, Igbo, Yoruba, Hausa. Muse Spark vision removes the first barrier - most victims don't know what a "transaction hash" is, but they all have a screenshot. Muse Voice Transcribe removes the next one: people can tell their story by speaking instead of writing a formal statement.

Because Muse Spark Open is open weights, the same model family runs on Fireworks and Baseten, so TraceX keeps working if one provider is down. Without these models, TraceX would be another explorer: data without meaning, and no help in a victim's own language.

## 3. Provide feedback from your experience using partner technologies.

- **Modal:** I deployed the Python/NetworkX detectors as a FastAPI web endpoint with a single `modal deploy`, and got one stable URL the backend calls on every trace. I kept a TypeScript copy of the detectors as a fallback, with parity tests, so a cold or unreachable endpoint never breaks a trace.
- **Fireworks AI:** setup was easy - an OpenAI-compatible endpoint and one key. On my account the serverless catalogue had `muse-spark-open` but no Llama models, so I switched to Muse Spark Open. Like Muse Spark, it reasons before answering: with a small `max_tokens` it returned no text at all until I gave it a 12,000-token budget and `reasoning_effort: low`. It was the slowest of the three for us (about 30 s for a brief, 77 s for a Recovery Kit).
- **Baseten:** Model APIs were the easiest path - no deployment, just a key and `meta-models/muse-spark-open` - and the fastest provider we tested (about 8 s for a brief, 36 s for a Recovery Kit in Igbo).
- **Suggestion:** a clear model catalogue per account and a note on reasoning-token budgets for Muse Spark Open would have saved time. For long hex strings in screenshots, Muse Spark Open on both partners dropped characters where Muse Spark on the Meta Model API read them exactly - worth documenting for anyone doing OCR-style tasks.

## 4. Project Description

**TraceX - Follow the money. Prove it.**

When crypto is stolen, the trail is public but almost nobody can read it. TraceX is a free, read-only blockchain forensics tool built in Enugu, Nigeria, for the people who need it most: scam victims and the investigators helping them.

Paste a transaction hash, wallet or ENS name - or just upload a screenshot - and TraceX follows the money forward in time across 7 EVM chains (Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon, Robinhood Chain), including canonical bridges. Deterministic detectors running on Modal flag mixers, peel chains, fast movement, exchange cash-outs and bridge exits. Muse Spark then explains the case in plain language, citing a transaction for every claim, and answers follow-up questions.

For victims, the Recovery Kit drafts an exchange records-preservation request and a police incident report in English, Nigerian Pidgin, Igbo, Yoruba or Hausa - with their own spoken account transcribed by Muse Voice Transcribe - and rejects any draft that invents a wallet or skips a transaction. Poisoning Shield warns about look-alike addresses and fake tokens before you send.

The AI runs on Muse Spark (Meta Model API) or Meta's open-weights Muse Spark Open on Fireworks and Baseten, with a model picker and automatic fallback. Verified on a real case: on 28 Oct 2026, 600 ETH went into Tornado Cash in six deposits within five minutes - TraceX traces it in seconds, scores it 70, and drafts the victim's documents in Igbo.

Live: https://trace-x-khaki.vercel.app · Video: https://youtu.be/UsOnJBtFpOI · Code: https://github.com/ekumahost/TraceX
