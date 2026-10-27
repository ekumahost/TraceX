from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title='TraceX Analysis Engine', version='0.1.0')

class TraceRequest(BaseModel):
    nodes: List[Dict]
    edges: List[Dict]

@app.get('/')
def health():
    return {'status': 'ok', 'service': 'tracex-analysis-engine'}

@app.post('/analyze/heuristics')
def analyze_heuristics(req: TraceRequest):
    risks = []
    mixer_addresses = ['0xtornado']  # placeholder
    for edge in req.edges:
        if edge.get('to', '').lower() in mixer_addresses:
            risks.append({'type': 'mixer', 'tx': edge.get('txHash'), 'severity': 'high'})
    from_counts = {}
    for e in req.edges:
        from_counts[e['from']] = from_counts.get(e['from'], 0) + 1
    for addr, count in from_counts.items():
        if count > 10:
            risks.append({'type': 'peel_chain', 'address': addr, 'count': count, 'severity': 'medium'})
    return {'risks': risks, 'nodes': len(req.nodes), 'edges': len(req.edges)}

@app.post('/analyze/risk')
def score_risk(address: str):
    return {'address': address, 'risk_score': 42, 'labels': []}
