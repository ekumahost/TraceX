"""
TraceX analysis engine on Modal - serverless, scales to zero between traces.

    pip install modal && modal setup      # one-time login
    modal serve modal_app.py              # temporary dev URL, hot reload
    modal deploy modal_app.py             # permanent URL

Set the printed URL as ANALYSIS_ENGINE_URL in application/backend/.env.
"""
import modal

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install("fastapi[standard]==0.115.5", "networkx==3.4.2", "pydantic==2.10.3")
    .add_local_python_source("app")
)

app = modal.App("tracex-analysis-engine", image=image)


@app.function(cpu=1, memory=512, timeout=60)
@modal.asgi_app()
def web():
    from app.main import api

    return api
