"""Turns the recorded frames + narration into the final MP4 and an SRT caption file.
Frames are placed by their real capture timestamps; each scene's voice clip starts when its scene did."""
import json, os, re, subprocess

OUT = os.environ.get("OUT", "../../demo-output/TraceX-Demo-Live.mp4")
t = json.load(open("out/timeline.json"))
frames, marks = t["frames"], t["marks"]
scenes = {s["id"]: s for s in json.load(open("out/audio/durations.json"))}
# Fast-forward dead air: any stretch longer than GAP seconds with no narration (waiting for the
# model, the trace) is squeezed to SQUEEZE seconds. remap() is piecewise linear over real time.
GAP, SQUEEZE, PAD = 2.0, 1.2, 0.5
spoken = sorted([(m["start"] - PAD, m["start"] + scenes[m["id"]]["seconds"] + PAD) for m in marks] +
                [(h["start"], h["end"]) for h in t.get("holds", [])])
segments, cursor = [], frames[0]
for a, b in spoken + [(frames[-1] + 1.0, frames[-1] + 1.0)]:
    if a - cursor > GAP:
        segments.append((cursor, a, SQUEEZE / (a - cursor)))
    cursor = max(cursor, b)

def remap(t):
    out, at = t, 0.0
    for a, b, k in segments:
        if t > a:
            at += (min(t, b) - a) * (1 - k)
    return out - at

frames = [remap(f) for f in frames]
for m in marks:
    m["start"] = remap(m["start"])
print(f"squeezed {len(segments)} silent stretches, saving {sum((b - a) * (1 - k) for a, b, k in segments):.1f}s")
t0 = frames[0]
end = max(frames[-1], max(m["start"] + scenes[m["id"]]["seconds"] for m in marks)) + 1.0

# 1. video: concat demuxer with each frame shown until the next one arrives
with open("out/frames.txt", "w") as f:
    for i, ts in enumerate(frames):
        nxt = frames[i + 1] if i + 1 < len(frames) else end
        f.write(f"file 'frames/{i:06d}.jpg'\nduration {max(nxt - ts, 0.001):.4f}\n")
    f.write(f"file 'frames/{len(frames) - 1:06d}.jpg'\n")

# 2. audio: every clip delayed to its scene start, mixed, loudness-normalised for YouTube
inputs, chains = [], []
for i, m in enumerate(marks):
    inputs += ["-i", f"out/audio/{m['id']}.wav"]
    ms = int((m["start"] - t0) * 1000)
    chains.append(f"[{i + 1}:a]adelay={ms}|{ms}[a{i}]")
mix = ";".join(chains) + ";" + "".join(f"[a{i}]" for i in range(len(marks))) + \
    f"amix=inputs={len(marks)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[aout]"
# screencast frames are occasionally trimmed (e.g. 1920x993) - fit every frame onto a 1080p canvas
video = "[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x07070d,fps=30,format=yuv420p[vout]"

subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", "out/frames.txt", *inputs,
                "-filter_complex", video + ";" + mix, "-map", "[vout]", "-map", "[aout]",
                "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", OUT], check=True)

# 3. captions: one cue per sentence, timed in proportion to its length within the scene's clip
def stamp(sec):
    h, rem = divmod(sec, 3600); m, s = divmod(rem, 60)
    return f"{int(h):02d}:{int(m):02d}:{s:06.3f}".replace(".", ",")
cues = []
for m in marks:
    sc = scenes[m["id"]]
    sentences = [x.strip() for x in re.split(r"(?<=[.!?])\s+", sc["text"]) if x.strip()]
    total = sum(len(x) for x in sentences)
    at = m["start"] - t0
    for sentence in sentences:
        span = sc["seconds"] * len(sentence) / total
        cues.append((at, at + span, sentence.replace("A.I.", "AI").replace("A.P.I.", "API").replace("E T H", "ETH")
                     .replace("B N B", "BNB").replace("P D F", "PDF").replace("C I", "CI").replace("Network X", "NetworkX")
                     .replace("Next js", "Next.js")))
        at += span
with open(OUT.rsplit(".", 1)[0] + ".srt", "w") as f:
    for i, (a, b, text) in enumerate(cues, 1):
        f.write(f"{i}\n{stamp(a)} --> {stamp(b)}\n{text}\n\n")

dur = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", OUT]).decode().strip()
print(f"wrote {OUT} ({float(dur):.1f}s) and captions")
