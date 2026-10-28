# Optional Inference and Analysis Providers

TraceX uses the Meta Model API with Muse Spark by default. Fireworks and Baseten are optional Llama 3.3 explanation providers; the Python/NetworkX service can be hosted separately, including on Modal. These integrations are configuration options, not prerequisites for a local run.

The hackathon event page lists Baseten, Modal, and Fireworks as partners. It describes $100 in credits for selected participants for each partner; this does not mean TraceX has received credits, deployed a service, or used each provider.

## AI provider routing

The backend tries the configured `AI_PROVIDER` first, then available explanation providers. Set provider keys in `application/backend/.env`; never put them in the frontend environment or commit them.

| Provider | Required settings | Model/path | Follow-up Q&A |
|---|---|---|---|
| Meta | `META_API_KEY` | Meta Model API; Muse Spark by default | Yes |
| Fireworks | `FIREWORKS_API_KEY` | Llama 3.3 70B Instruct | Yes |
| Baseten | `BASETEN_API_KEY`, `BASETEN_MODEL_ID` | Compatible deployed model endpoint | No; Q&A skips this provider |

These are API integrations. Only describe a provider as live or tested after setting its credentials and verifying an actual response. The app displays which provider answered.

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
