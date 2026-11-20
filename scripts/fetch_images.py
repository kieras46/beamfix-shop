"""Download product photos from eBay into img/<id>.jpg (run by GitHub Actions)."""
import json, os, io, urllib.request
from PIL import Image

os.makedirs("img", exist_ok=True)
ids = sorted({p["img"] for p in json.load(open("products.json"))})
for i in ids:
    out = f"img/{i.replace('~', '_')}.jpg"
    if os.path.exists(out):
        continue
    url = f"https://i.ebayimg.com/images/g/{i}/s-l1600.webp"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        im = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert("RGB")
        im.thumbnail((1200, 1200))
        im.save(out, "JPEG", quality=85, optimize=True)
        print("saved", out)
    except Exception as e:
        print("FAILED", i, e)
