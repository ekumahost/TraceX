import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.heuristics import analyze
from app.main import api

FIXTURE = json.loads((Path(__file__).parent / "fixtures/sample_case.json").read_text())
NODES, EDGES = FIXTURE["input"]["nodes"], FIXTURE["input"]["edges"]
by_label = {n.get("label"): n["id"] for n in NODES}


@pytest.mark.parametrize("fixture", ["sample_case.json", "exchange_hop.json", "mixer_deposits.json"])
def test_matches_typescript_detectors(fixture):
    # same findings, in the same order, as backend/src/services/heuristics.ts
    data = json.loads((Path(__file__).parent / "fixtures" / fixture).read_text())
    result = analyze(data["input"]["nodes"], data["input"]["edges"])
    strip = lambda rs: [{k: r.get(k) for k in ("type", "severity", "tx", "address", "detail")} for r in rs]
    assert strip(result["risks"]) == strip(data["expected"]["risks"])
    assert result["node_risk"] == data["expected"]["nodeRisk"]


def test_sample_case_flags_and_score():
    result = analyze(NODES, EDGES)
    types = [r["type"] for r in result["risks"]]
    assert types.count("mixer") == 2
    assert {"peel_chain", "velocity", "exchange_hop", "bridge"} <= set(types)
    assert result["score"] == 100  # high floor 70 + 15 + 3x8 + 3, capped
    peel = next(r for r in result["risks"] if r["type"] == "peel_chain")
    assert peel["address"] == by_label["Peel 1"] and peel["count"] == 3


def test_clean_flow_has_no_flags():
    nodes = [{"id": "0xa", "type": "source", "hop": 0}, {"id": "0xb", "type": "wallet", "hop": 1}]
    edges = [{"id": "e1", "from": "0xa", "to": "0xb", "txHash": "0x1", "value": 1.0, "asset": "ETH",
              "timestamp": "2026-10-14T02:11:00.000Z", "hop": 1}]
    result = analyze(nodes, edges)
    assert result["risks"] == [] and result["score"] == 0


def test_exchange_hopping():
    nodes = [{"id": "0xs", "type": "source", "hop": 0}, {"id": "0xe1", "type": "exchange", "hop": 1, "label": "Exchange A"},
             {"id": "0xw", "type": "wallet", "hop": 2}, {"id": "0xe2", "type": "exchange", "hop": 3, "label": "Exchange B"}]
    t = "2026-10-14T02:11:00.000Z"
    edges = [{"id": "1", "from": "0xs", "to": "0xe1", "txHash": "0x1", "value": 5, "asset": "ETH", "timestamp": t, "hop": 1},
             {"id": "2", "from": "0xe1", "to": "0xw", "txHash": "0x2", "value": 5, "asset": "ETH", "timestamp": t, "hop": 2},
             {"id": "3", "from": "0xw", "to": "0xe2", "txHash": "0x3", "value": 5, "asset": "ETH", "timestamp": t, "hop": 3}]
    details = [r["detail"] for r in analyze(nodes, edges)["risks"]]
    assert any("Exchange A on to Exchange B" in d for d in details)


def test_http_endpoint():
    client = TestClient(api)
    assert client.get("/").json()["status"] == "ok"
    res = client.post("/analyze", json={"nodes": NODES, "edges": EDGES})
    assert res.status_code == 200
    body = res.json()
    assert body["engine"] == "python-networkx" and body["score"] == 100 and len(body["risks"]) == 6
    assert client.post("/analyze", json={"nodes": [{"id": "x", "type": "alien", "hop": 0}], "edges": []}).status_code == 422


def test_repeat_deposits_are_one_finding_and_score_high():
    data = json.loads((Path(__file__).parent / "fixtures/mixer_deposits.json").read_text())
    result = analyze(data["input"]["nodes"], data["input"]["edges"])
    mixer = [r for r in result["risks"] if r["type"] == "mixer"]
    assert len(mixer) == 1 and mixer[0]["count"] == 6 and "600 ETH" in mixer[0]["detail"]
    assert result["score"] == data["expected"]["score"] >= 70  # one mixer finding alone is high risk
