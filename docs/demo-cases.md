# Demo cases

Real cases traced end to end on 2026-10-28 with Alchemy + the Modal engine. Re-run each one
before recording - on-chain data is permanent, but labels and timings can shift.

## 1. Suspicious - 600 ETH into Tornado Cash in five minutes (Ethereum)
Paste: `0x08bf5ce46d97ec6299b7a4d1ba9b37591a66c97775186ffd30a1cd023d909b90` (chain: Auto)

- 06:25 UTC - `0x241e…db8e` sends **600.099 ETH** to `0x884f…e79e`
- 06:28–06:30 - `0x884f…e79e` deposits **6 × 100 ETH into Tornado Cash's 100 ETH pool**
- Result: 3 wallets, 7 transfers, high-severity mixer flag, depositor wallet risk 85, ~6s
- Story to tell: TraceX followed the money from the funding transaction straight into the mixer
  and cites every deposit by tx hash.

**Bonus - address poisoning, visible in the same case.** Within minutes the depositor also
received dust from look-alike addresses (`0x241e94…db8e`, `0x241b22…db8e`) and a fake ERC-20
token named "ETH" for the exact same 600.099 amount, claiming to come from the real funder
(`0x9277e51fcff1fa173d73b3d9fc1f6d68a12f9a84b6d40067c538d11789010412`). Paste that fake-token
tx and TraceX refuses it: it only follows real ETH and verified tokens.

## 2. Clean - vitalik.eth (Ethereum)
Paste: `vitalik.eth` (chain: Ethereum)

- Resolves the ENS name, follows recent outgoing transfers a few hops
- Result: no flags, score 0 - shows TraceX doesn't cry wolf

## 3. Multi-chain - Robinhood Chain (auto-detected)
Paste: `0xd9e1e3e38b204992a2712e8611b683afb67b40025894ff30049d2617c3a97e0f` (chain: Auto)

- TraceX searches all 7 chains and finds it on Robinhood Chain; trace includes ETH and USDG
