# Inference and Analysis Providers

TraceX runs Meta's Muse Spark models on three providers, and its deterministic detectors on Modal. All four are hackathon partners or Meta services, and all four are configured on the deployed app.

## AI providers

All three providers use the OpenAI-compatible chat API, so one client covers them ([`providers.ts`](../application/backend/src/lib/providers.ts)), and all three get the same prompts ([`ai-unified.ts`](../application/backend/src/lib/ai-unified.ts)).

| Provider | Key | Default model (override) | Brief | Questions | Recovery Kit |
|---|---|---|---|---|---|
| Meta Model API | `META_API_KEY` | `muse-spark-1.3` (`META_MODEL`) | Yes | Yes | Yes |
| Fireworks AI | `FIREWORKS_API_KEY` | `accounts/fireworks/models/muse-spark-open` (`FIREWORKS_MODEL`) | Yes | Yes | Yes |
| Baseten Model APIs | `BASETEN_API_KEY` | `meta-models/muse-spark-open` (`BASETEN_MODEL`) | Yes | Yes | Yes |

- **Choosing:** the workspace model picker sends `provider` with each request. Auto sends nothing; the backend then starts with `AI_PROVIDER` (default `meta`).
- **Fallback:** providers with a key are tried first, in order. An error, an empty answer, or running out of tokens moves on to the next provider; the response includes `fellBackFrom` and the UI shows "Switched automatically". If every provider fails, the API returns an error, never placeholder text.
- **Reasoning budget:** Muse Spark and Muse Spark Open reason before answering and the reasoning counts against `max_tokens`, so every Muse Spark model gets a 12,000-token budget and `reasoning_effort: low`.
- **Status:** `GET /api/providers` lists each provider, its model and whether a key is set (never the key itself).
- Keys live only in `application/backend/.env` locally and in the Render dashboard in production. Never put them in the frontend environment or commit them.

Verified live on 2 Nov 2026 against the real Tornado Cash case in [`demo-cases.md`](demo-cases.md): brief, follow-up question and Igbo Recovery Kit on each provider.

## Other Meta models on the Meta Model API

| Model | Used for | Code |
|---|---|---|
| Muse Spark (vision) | Screenshot to trace - reading hashes and addresses from an image, then checking them on-chain | [`extract.ts`](../application/backend/src/services/extract.ts) |
| `muse-voice-transcribe-1.0` | Voice statement in the Recovery Kit (`POST /v1/asr/transcribe`, 16 kHz mono WAV, `languageBias`, `keywords`) | [`transcribe.ts`](../application/backend/src/services/transcribe.ts) |

Both use `META_API_KEY`. Screenshot reading falls back to Muse Spark Open on Fireworks or Baseten if the Meta Model API fails, but in testing only the Meta Model API read 66-character hashes exactly, which is why the on-chain check exists.

## Optional Python analysis service

The backend calls `${ANALYSIS_ENGINE_URL}/analyze` when `ANALYSIS_ENGINE_URL` is configured. The service runs the deterministic Python/NetworkX detectors. If it is unset or unavailable, the backend uses its TypeScript detector implementation.

For local development:

```bash
cd application/analysis-engine
python3 -m venv .venv
.venv/bin/pip install -r requirements-dev.txt
.venv/bin/uvicorn app.main:api --port 8100
```

Then set `ANALYSIS_ENGINE_URL=http://localhost:8100` in the backend environment. To deploy with Modal, install the Modal CLI, authenticate, and run `modal deploy modal_app.py`; use the URL it prints. Confirm the deployed URL responds before describing the Python/Modal service as active in a demo.

## Evidence and model limitations

The model receives a bounded graph and deterministic findings. Prompts ask it to use those inputs and cite transactions, but prompts are not citation enforcement and cannot eliminate hallucinations. The interface turns matching transaction hashes into evidence links; reviewers should verify generated claims against the linked explorer records.
