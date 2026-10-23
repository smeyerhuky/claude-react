#!/usr/bin/env python3
"""Build a 24fps timelapse from historical PR commit screenshots."""
import json
import os
from pathlib import Path
import subprocess
import sys

def cmd(*args, check=True):
    return subprocess.run(args, check=check, text=True, capture_output=True)

pr = os.environ["PR_NUMBER"]
repo = os.environ["GITHUB_REPOSITORY"]
output = Path("metro-timelapse")
output.mkdir(exist_ok=True)
commits = json.loads(cmd("gh", "api", f"repos/{repo}/pulls/{pr}/commits?per_page=100").stdout)
# GitHub REST pagination for PRs with >100 commits.
if len(commits) == 100:
    commits = json.loads(cmd("gh", "api", "--paginate", f"repos/{repo}/pulls/{pr}/commits?per_page=100", "--slurp").stdout)
    commits = [item for page in commits for item in page]
sha_list = [c["sha"] for c in commits]
frames = []
blob_shas = set()
for sha in sha_list:
    if cmd("git", "cat-file", "-e", f"{sha}^{{commit}}", check=False).returncode:
        cmd("git", "fetch", "--quiet", "origin", sha, check=False)
    rev = cmd("git", "rev-parse", f"{sha}:docs/screenshots/metro-default.png", check=False)
    if rev.returncode:
        continue
    # Images are binary: do not use text subprocess capture for extraction.
    path = output / f"frame-{len(frames):04d}.png"
    with path.open("wb") as fp:
        result = subprocess.run(["git", "show", f"{sha}:docs/screenshots/metro-default.png"], stdout=fp, stderr=subprocess.DEVNULL)
    if result.returncode or path.stat().st_size < 100:
        path.unlink(missing_ok=True)
        continue
    blob_shas.add(rev.stdout.strip())
    frames.append(path)

manifest = {"pr": int(pr), "commits": len(sha_list), "frames": len(frames),
            "unique_screenshot_versions": len(blob_shas), "fps": 24}
if frames:
    listing = output / "frames.txt"
    with listing.open("w") as fp:
        for path in frames:
            fp.write(f"file '{path.name}'\n")
            fp.write("duration 0.5\n")
        fp.write(f"file '{frames[-1].name}'\n")
    video = output / f"metro-pr-{pr}-timelapse.mp4"
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "concat", "-safe", "0", "-i", str(listing),
        "-vf", "fps=24,scale=1280:720:force_original_aspect_ratio=decrease,"
               "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white,format=yuv420p",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "27",
        "-movflags", "+faststart", str(video),
    ], check=True)
    manifest["video"] = str(video)
(output / "manifest.json").write_text(json.dumps(manifest, indent=2))
print(json.dumps(manifest))
