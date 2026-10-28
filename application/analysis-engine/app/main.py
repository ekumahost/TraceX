from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict, Field

from app.heuristics import analyze

api = FastAPI(title="TraceX Analysis Engine", version="0.2.0")


class Node(BaseModel):
    id: str
    type: Literal["source", "wallet", "exchange", "mixer", "bridge", "contract"]
    hop: int
    label: str | None = None
    risk: int = 0


class Edge(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    from_: str = Field(alias="from")
    to: str
    txHash: str
    value: float
    asset: str
    timestamp: str
    hop: int


class AnalyzeRequest(BaseModel):
    nodes: list[Node]
    edges: list[Edge]


@api.get("/")
def health():
    return {"status": "ok", "service": "tracex-analysis-engine", "version": api.version}


@api.post("/analyze")
def analyze_case(req: AnalyzeRequest):
    nodes = [n.model_dump() for n in req.nodes]
    edges = [e.model_dump(by_alias=True) for e in req.edges]
    return {**analyze(nodes, edges), "engine": "python-networkx"}
