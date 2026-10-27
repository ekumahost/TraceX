# TraceX AI - Requirements Document
Version: 0.1.0 | Date: 2026-10-27 | Status: Draft

## 1. Vision
TraceX AI is an intelligent blockchain investigation platform that helps users trace cryptocurrency transactions, investigate suspicious fund movements, and understand where their money goes on-chain.

It combines deterministic blockchain data retrieval + graph analysis + Meta AI interpretation to produce evidence-backed investigation reports.

## 2. Target Users
- Crypto users who lost funds / want to verify recipient
- Developers building compliance tools
- Exchanges / compliance teams
- Security researchers / auditors
- Law enforcement (read-only investigative aid)

## 3. Core Use Cases
1. **Trace Transaction Trail**: Input tx hash or wallet address → retrieve full movement history across hops
2. **Investigate Suspicious Patterns**: Detect mixers (Tornado Cash), peel chains, high-velocity laundering, circular funding, exchange hopping
3. **Wallet Risk Profiling**: Score address based on interactions with known risky entities
4. **Evidence Report Generation**: Generate PDF report with transaction graph, timeline, labels, risk scores, AI summary
5. **Interactive Investigation**: User can expand/collapse nodes, follow funds, ask AI "where did this go after this?"

## 4. Functional Requirements

### 4.1 Blockchain Data Layer
- FR1: Support EVM chains initially (Ethereum mainnet), extensible to BSC, Polygon, Arbitrum, Base
- FR2: Fetch transaction details, internal transactions, token transfers (ERC20/721/1155)
- FR3: Resolve ENS, address labels (Etherscan, Arkham-style labeling)
- FR4: Historical balance and fund flow over time

### 4.2 Investigation Engine (Deterministic)
- FR5: Build fund flow graph (UTXO-like model for account model): nodes = addresses, edges = transfers with value, timestamp, tx hash
- FR6: Trace forward/backward up to N hops (default 5, configurable up to 20)
- FR7: Heuristics: mixer detection, peel chain, same-entity clustering, change address detection, dusting
- FR8: Risk scoring: address risk, transaction risk, path risk (0-100)

### 4.3 AI Interpretation Layer
- FR9: Use Meta AI to explain transaction patterns in plain English
- FR10: Natural language queries: "Did this wallet interact with a mixer?"
- FR11: Generate investigation summary: narrative of what happened
- FR12: Suggest next steps for investigation

### 4.4 UI / UX
- FR13: Input bar for tx hash / address / ENS
- FR14: Interactive graph visualization (React Flow / Cytoscape) with zoom, filter by value, time, token
- FR15: Timeline view of fund movements
- FR16: Entity panel: labels, risk score, known tags
- FR17: Report export (PDF + JSON)
- FR18: Amazing dark-mode investigative UI (think Arkham + Linear + Chainalysis)

### 4.5 System
- FR19: Caching of blockchain data (Postgres + Redis)
- FR20: Rate limiting, API keys for blockchain providers
- FR21: Authentication for saving investigations
- FR22: Audit log of investigation actions

## 5. Non-Functional Requirements
- NFR1: Response time < 3s for 5-hop trace on Ethereum
- NFR2: Evidence-backed: every AI claim must cite tx hash / on-chain data
- NFR3: Explainability: show deterministic steps before AI interpretation
- NFR4: Privacy: no storage of private keys, read-only
- NFR5: Extensibility: plug new chains via adapter pattern

## 6. MVP Scope (Phase 1)
- Ethereum mainnet only
- Tx hash → forward trace 5 hops
- ERC20 + ETH transfers
- Graph visualization + timeline
- Basic heuristics: mixer, exchange, high-value peel
- AI summary report
- PDF export

## 7. Out of Scope for MVP
- Bitcoin UTXO tracing (Phase 2)
- Real-time alerting
- Private cluster labeling
- Mobile app

## 8. Success Metrics
- Trace completes < 3s
- User can understand fund flow without reading raw explorer
- Report is usable as evidence draft
