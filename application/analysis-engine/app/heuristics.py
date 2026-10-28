"""
TraceX heuristics - deterministic detectors over a traced fund-flow graph, built on NetworkX.

They only report what the edges show, each with the tx hash that proves it; the AI layer
explains these findings, it never invents them. Kept in step with the backend's TypeScript
fallback (backend/src/services/heuristics.ts) - tests/test_heuristics.py checks both agree
on the sample case.
"""
from __future__ import annotations

from datetime import datetime

import networkx as nx

BASE_RISK = {"source": 0, "wallet": 10, "contract": 10, "exchange": 40, "bridge": 45, "mixer": 95}
# case score: the worst finding sets the floor, each further finding adds a little
SCORE_FLOOR = {"high": 70, "medium": 40, "low": 15}
SCORE_EXTRA = {"high": 15, "medium": 8, "low": 3}
SEVERITY_RANK = {"high": 0, "medium": 1, "low": 2}
MAX_RISKS = 12


def _fmt(value: float, asset: str) -> str:
    digits = 0 if value >= 100 else 3
    text = f"{value:,.{digits}f}".rstrip("0").rstrip(".") if digits else f"{value:,.0f}"
    return f"{text} {asset}"


def _minutes(ms: float) -> str:
    m = round(ms / 60000)
    return f"{m} minutes" if m < 120 else f"{round(m / 60)} hours"


def _ts(edge: dict) -> float:
    return datetime.fromisoformat(edge["timestamp"].replace("Z", "+00:00")).timestamp() * 1000


def build_graph(nodes: list[dict], edges: list[dict]) -> nx.MultiDiGraph:
    g = nx.MultiDiGraph()
    for n in nodes:
        g.add_node(n["id"], **n)
    for e in edges:
        g.add_edge(e["from"], e["to"], key=e["id"], **e)
    return g


def analyze(nodes: list[dict], edges: list[dict]) -> dict:
    """Returns {"risks", "node_risk", "score"} for a traced case."""
    g = build_graph(nodes, edges)
    node = lambda nid: g.nodes[nid] if nid in g else {}
    name = lambda nid: node(nid).get("label") or f"{nid[:8]}…{nid[-4:]}"
    outs = lambda nid: [d for _, _, d in g.out_edges(nid, data=True)]

    risk = {nid: BASE_RISK.get(d.get("type"), 10) for nid, d in g.nodes(data=True)}

    def bump(nid: str, value: int) -> None:
        if node(nid).get("type") != "source":
            risk[nid] = max(risk.get(nid, 0), value)

    risks: list[dict] = []

    # repeated transfers between the same pair are one finding: "600 ETH across 6 deposits"
    def grouped(match):
        groups: dict[str, list[dict]] = {}
        for e in edges:
            if match(e):
                groups.setdefault(f"{e['from']}|{e['to']}|{e['asset']}", []).append(e)
        return [(g[0], len(g), sum(x["value"] for x in g)) for g in groups.values()]

    times = lambda n, noun: f" across {n} {noun}" if n > 1 else ""

    # mixers: deposits in, and wallets funded out of them
    for e, n, total in grouped(lambda e: node(e["to"]).get("type") == "mixer"):
        bump(e["from"], 85)
        risks.append({"type": "mixer", "severity": "high", "tx": e["txHash"], "address": e["to"], "count": n,
                      "detail": f"{_fmt(total, e['asset'])} sent from {name(e['from'])} into {name(e['to'])}{times(n, 'deposits')}."})
    for e, n, total in grouped(lambda e: node(e["from"]).get("type") == "mixer"):
        bump(e["to"], 75)
        risks.append({"type": "mixer", "severity": "high", "tx": e["txHash"], "address": e["to"], "count": n,
                      "detail": f"{name(e['to'])} received {_fmt(total, e['asset'])} withdrawn from {name(e['from'])}{times(n, 'withdrawals')}."})

    # peel chain: one dominant outflow (>= 60%) plus a small shave (<= 10%), repeated down the chain
    def peel_next(nid: str) -> dict | None:
        o = outs(nid)
        if len(o) < 2 or len({x["asset"] for x in o}) > 1:
            return None
        total = sum(x["value"] for x in o)
        big = max(o, key=lambda x: x["value"])
        shaved = any(x is not big and x["value"] / total <= 0.1 for x in o)
        return big if big["value"] / total >= 0.6 and shaved else None

    in_chain: set[str] = set()
    for n in nodes:
        if n["id"] in in_chain:
            continue
        chain, cur, seen = [], n["id"], set()
        while cur and cur not in seen:
            seen.add(cur)
            nxt = peel_next(cur)
            if not nxt:
                break
            chain.append(nxt)
            cur = nxt["to"]
        if len(chain) >= 3:
            for e in chain:
                in_chain.add(e["from"])
                bump(e["from"], 60)
            shaved = [min(x["value"] for x in outs(e["from"]) if x is not e) for e in chain]
            asset = chain[0]["asset"]
            risks.append({"type": "peel_chain", "severity": "medium", "address": n["id"], "count": len(chain), "tx": chain[0]["txHash"],
                          "detail": f"{len(chain)} wallets in a row from {name(n['id'])} each pass most of the balance on while shaving "
                                    f"{_fmt(min(shaved), asset)}–{_fmt(max(shaved), asset)} off."})

    # velocity: many hops crossed within the first hour
    if edges:
        t0 = min(_ts(e) for e in edges)
        fast = [e for e in edges if _ts(e) - t0 <= 60 * 60_000]
        deepest = max(fast, key=lambda e: e["hop"]) if fast else None
        if deepest and deepest["hop"] >= 3:
            first = next(e for e in edges if _ts(e) == t0)
            risks.append({"type": "velocity", "severity": "medium", "tx": first["txHash"],
                          "detail": f"Funds crossed {deepest['hop']} hops in {_minutes(_ts(deepest) - t0)} - far faster than normal wallet activity."})

    # exits: exchange deposits (KYC may identify the owner) and bridges (trail continues elsewhere)
    for e, n, total in grouped(lambda e: node(e["to"]).get("type") == "exchange" and e["hop"] > 1):
        risks.append({"type": "exchange_hop", "severity": "medium", "tx": e["txHash"], "address": e["to"], "count": n,
                      "detail": f"{_fmt(total, e['asset'])} reached {name(e['to'])}{times(n, 'transfers')} - an exchange where KYC records may identify the owner."})
    for e, n, total in grouped(lambda e: node(e["to"]).get("type") == "bridge"):
        risks.append({"type": "bridge", "severity": "low", "tx": e["txHash"], "address": e["to"], "count": n,
                      "detail": f"{_fmt(total, e['asset'])} sent into {name(e['to'])}{times(n, 'transfers')}; the trail continues on another chain."})

    # exchange hopping: the same funds pass through more than one exchange along a path
    exchanges = [nid for nid, d in g.nodes(data=True) if d.get("type") == "exchange"]
    for a in exchanges:
        for b in exchanges:
            if a != b and nx.has_path(g, a, b):
                path = nx.shortest_path(g, a, b)
                hop_edge = next(iter(g.get_edge_data(path[0], path[1]).values()))
                risks.append({"type": "exchange_hop", "severity": "medium", "tx": hop_edge["txHash"], "address": a,
                              "detail": f"Funds moved from {name(a)} on to {name(b)} - hopping between exchanges to break the trail."})

    # drop exact repeats (e.g. the same exchange-hopping pair found twice)
    seen_keys: set[str] = set()
    unique = []
    for r in risks:
        key = f"{r['type']}|{r.get('address') or ''}|{r.get('tx') or ''}"
        if key not in seen_keys:
            seen_keys.add(key)
            unique.append(r)
    unique.sort(key=lambda r: SEVERITY_RANK[r["severity"]])
    unique = unique[:MAX_RISKS]

    score = 0
    if unique:
        worst, *rest = unique  # already sorted worst first
        score = min(100, SCORE_FLOOR[worst["severity"]] + sum(SCORE_EXTRA[r["severity"]] for r in rest))
    return {"risks": unique, "node_risk": risk, "score": score}
