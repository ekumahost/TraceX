# Demo video

Records the narrated TraceX walkthrough from the **live app** on the real case in `docs/demo-cases.md`.

```bash
# app running: backend :4000 (real keys) and frontend :3300 (`npm run build && npm start` - no dev badge)
cd tools/demo-video && npm install
npm run narrate   # narration.json -> out/audio/*.wav (macOS `say`, VOICE=Daniel)
npm run record    # drives Chrome scene by scene with a visible cursor, captures frames
npm run build     # stitches frames + voice, fast-forwards silent waits -> demo-output/TraceX-Demo-Live.mp4 + .srt
```

- Each scene lasts at least as long as its narration line, so voice and screen stay in sync.
- Waiting for the model or the trace is fast-forwarded; result screens play at full speed.
- `screenshots.mjs` refreshes `docs/screenshots` from the same case.

## Use your own voice
Record one clip per scene, named by the scene ids in `narration.json` (`intro.wav`, `paste.wav`, ...), into
`out/audio/`, then run `KEEP_WAV=1 npm run narrate && npm run record && npm run build`.
Each scene stretches to fit your clip.
