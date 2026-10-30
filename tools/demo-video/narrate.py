"""Synthesises the narration (macOS `say`) one clip per scene and records each clip's length.
To use your own voice instead, record out/audio/<scene>.wav for each scene in narration.json."""
import json, subprocess, os

VOICE = os.environ.get("VOICE", "Daniel")
os.makedirs("out/audio", exist_ok=True)
scenes = json.load(open("narration.json"))
for s in scenes:
    aiff, wav = f"out/audio/{s['id']}.aiff", f"out/audio/{s['id']}.wav"
    if not os.environ.get("KEEP_WAV") or not os.path.exists(wav):
        subprocess.run(["say", "-v", VOICE, "-r", "178", "-o", aiff, s["text"]], check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", aiff, "-ar", "48000", "-ac", "2", wav], check=True)
    s["seconds"] = round(float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav])), 2)
    print(f"{s['id']:9} {s['seconds']:5.1f}s")
json.dump(scenes, open("out/audio/durations.json", "w"), indent=1)
print("total", round(sum(s["seconds"] for s in scenes), 1), "s")
