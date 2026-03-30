#!/bin/bash
# Downloads celebrity images one by one with a delay to avoid Wikimedia rate limiting.
# Run from app/ directory: bash scripts/dl-wealth-images.sh

OUTDIR="public/images/wealth"
DATA="app/wealth_data.json"
TMPFILE="/tmp/wealth_updated.json"

mkdir -p "$OUTDIR"

python3 - <<'PYEOF'
import json, subprocess, os, time, sys, hashlib

data_path = "app/wealth_data.json"
out_dir   = "public/images/wealth"

with open(data_path) as f:
    data = json.load(f)

updated = []
ok = 0
fail = 0
skip = 0

for celeb in data:
    img = celeb.get("image", "")
    if not img or not img.startswith("http"):
        updated.append(celeb)
        skip += 1
        continue

    # Derive filename from celeb name
    safe = celeb["name"].lower()
    for ch in " /\\:*?\"<>|',.!@#$%^&()[]{}":
        safe = safe.replace(ch, "_")
    while "__" in safe:
        safe = safe.replace("__", "_")
    safe = safe.strip("_")
    ext = ".jpg"
    filename = safe + ext
    dest = os.path.join(out_dir, filename)
    local_path = f"/images/wealth/{filename}"

    # Skip if already downloaded (non-empty)
    if os.path.exists(dest) and os.path.getsize(dest) > 5000:
        print(f"  [skip] {celeb['name']}")
        updated.append({**celeb, "image": local_path})
        ok += 1
        continue

    print(f"  Downloading {celeb['name']}...", end=" ", flush=True)

    result = subprocess.run([
        "curl", "-s", "-L", "-o", dest,
        "--max-time", "20",
        "-w", "%{http_code}",
        "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "-H", "Accept: image/webp,image/*,*/*;q=0.8",
        img
    ], capture_output=True, text=True)

    code = result.stdout.strip()
    size = os.path.getsize(dest) if os.path.exists(dest) else 0

    if code == "200" and size > 5000:
        print(f"✓ ({size//1024}KB)")
        updated.append({**celeb, "image": local_path})
        ok += 1
    else:
        print(f"✗ HTTP {code} size={size}")
        # Remove bad file
        if os.path.exists(dest):
            os.remove(dest)
        updated.append(celeb)
        fail += 1

    time.sleep(3)

with open(data_path, "w") as f:
    json.dump(updated, f, indent=2, ensure_ascii=False)

print(f"\n✅ Done: {ok} downloaded, {fail} failed, {skip} skipped (no URL)")
print(f"Updated: {data_path}")
PYEOF
