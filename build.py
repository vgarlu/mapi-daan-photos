#!/usr/bin/env python3
"""Generate thumbnails + photos.json for the cloned gallery."""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.expanduser("~/projects/mapi-daan-photos")
SRC = os.path.join(ROOT, "images")
THUMBS = os.path.join(ROOT, "thumbs")
DATA = os.path.join(ROOT, "data")
os.makedirs(THUMBS, exist_ok=True)
os.makedirs(DATA, exist_ok=True)

M = json.load(open(os.path.expanduser("~/.hermes/cache/scratch/manifest.json")))
SCENE_NAMES = {s["id"]: s["name"] for s in M["scenes"]}
SCENE_ORDER = [s["id"] for s in M["scenes"]]

def make_thumb(pid):
    src = os.path.join(SRC, f"{pid}.jpg")
    dst = os.path.join(THUMBS, f"{pid}.webp")
    if os.path.exists(dst):
        return pid, True
    try:
        im = Image.open(src)
        im = im.convert("RGB")
        w, h = im.size
        tw = 480
        if w > tw:
            im = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        im.save(dst, "WEBP", quality=78, method=4)
        return pid, True
    except Exception as e:
        return pid, str(e)

photos = []
for p in M["photos"]:
    pid = p["photoId"]
    f = os.path.join(SRC, f"{pid}.jpg")
    if not os.path.exists(f):
        print("MISSING", pid)
        continue
    im = Image.open(f)
    w, h = im.size
    photos.append({
        "id": pid,
        "s": p["sceneId"],
        "w": w,
        "h": h,
        "l": 1 if w > h else 0,
    })

# keep gallery order, but drop scenes with no photos
present = {p["s"] for p in photos}
scenes = [{"id": sid, "name": SCENE_NAMES[sid],
           "count": sum(1 for p in photos if p["s"] == sid)}
          for sid in SCENE_ORDER if sid in present]

json.dump({"scenes": scenes, "photos": photos},
          open(os.path.join(DATA, "photos.json"), "w"), separators=(",", ":"))

with ThreadPoolExecutor(max_workers=8) as ex:
    ok = 0
    for pid, st in ex.map(make_thumb, [p["id"] for p in photos], chunksize=16):
        if st is True:
            ok += 1
        else:
            print("thumb fail", pid, st)
print(f"photos={len(photos)} thumbs_ok={ok} scenes={len(scenes)}")
