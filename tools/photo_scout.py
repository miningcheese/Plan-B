"""Finds freely licensed Mauritius photos on Wikimedia Commons and downloads them for review.

Runs in GitHub Actions (the dev container can't reach Commons). Writes scout/*.jpg and
scout/meta.json with each photo's title, author and license, for picking the app's photos.
"""
import html
import json
import os
import re
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "BusinessApp-photo-scout/1.0 (private personal app; github.com/miningcheese/plan-b)"}
QUERIES = [
    "Ebene Cybercity Mauritius", "Ebène Mauritius tower", "Port Louis aerial view", "Caudan Waterfront night",
    "Port Louis Chinatown", "Bagatelle Mall Mauritius", "La Croisette Grand Baie", "Port Louis skyscrapers",
    "Mauritius Port Louis waterfront evening", "Rose Hill Mauritius", "Quatre Bornes Mauritius", "Le Caudan Waterfront",
]
OK_LICENSES = ("CC BY", "CC0", "Public domain", "CC-BY", "PD")


def get(params):
    url = API + "?" + urllib.parse.urlencode({**params, "format": "json", "formatversion": "2"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return json.load(r)


def text(em, key):
    return re.sub(r"\s+", " ", re.sub("<[^>]+>", "", html.unescape(em.get(key, {}).get("value", "")))).strip()


def main():
    os.makedirs("scout", exist_ok=True)
    start = len([f for f in os.listdir("scout") if f.endswith(".jpg")])
    meta = []
    for qi, q in enumerate(QUERIES):
        r = get({"action": "query", "generator": "search", "gsrsearch": q + " filetype:bitmap", "gsrnamespace": 6,
                 "gsrlimit": 10, "prop": "imageinfo", "iiprop": "url|extmetadata|size|mime", "iiurlwidth": 1280})
        pages = sorted(r.get("query", {}).get("pages", []), key=lambda p: p.get("index", 0))
        kept = 0
        for p in pages:
            ii = (p.get("imageinfo") or [{}])[0]
            em = ii.get("extmetadata", {})
            lic = text(em, "LicenseShortName")
            if ii.get("mime") != "image/jpeg" or not lic.startswith(OK_LICENSES) or ii.get("width", 0) < 1000:
                continue
            name = f"c{qi:02d}-{start + len(meta):03d}.jpg"
            try:
                with urllib.request.urlopen(urllib.request.Request(ii["thumburl"], headers=UA), timeout=60) as img:
                    data = img.read()
            except Exception as e:  # skip what won't download
                print("skip", p["title"], e)
                continue
            open(f"scout/{name}", "wb").write(data)
            meta.append({"file": name, "query": q, "title": p["title"], "author": text(em, "Artist"),
                         "license": lic, "licenseUrl": text(em, "LicenseUrl"), "page": ii.get("descriptionurl"),
                         "desc": text(em, "ImageDescription")[:240], "size": [ii.get("width"), ii.get("height")]})
            kept += 1
            time.sleep(0.5)
            if kept >= 6:
                break
        print(q, kept)
    old = json.load(open("scout/meta.json")) if os.path.exists("scout/meta.json") else []
    json.dump(old + meta, open("scout/meta.json", "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
