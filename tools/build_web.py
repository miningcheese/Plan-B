"""Builds the web version of Business App into web/ (for Netlify, or any static host).

The same screens as the Android app (app/src/main/assets), plus web-src/: a browser stand-in for the
Android side (web-bridge.js), the home-screen icon and manifest, and an offline cache (sw.js).
On an iPhone: open the site in Safari, Share → Add to Home Screen.

    python3 tools/build_web.py
"""
import hashlib
import json
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "app", "src", "main", "assets")
WEB_SRC = os.path.join(ROOT, "web-src")
OUT = os.path.join(ROOT, "web")

HEAD = """<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Business App">
<meta name="theme-color" content="#E7D4DC">
<meta name="robots" content="noindex, nofollow">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<link rel="icon" href="icons/icon-192.png">
<style>html,body{touch-action:manipulation}</style>
"""
SW = """<script>if ('serviceWorker' in navigator) addEventListener('load', function(){ navigator.serviceWorker.register('sw.js'); });</script>
"""


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    shutil.copytree(ASSETS, OUT)
    for name in ("web-bridge.js", "manifest.webmanifest"):
        shutil.copy(os.path.join(WEB_SRC, name), OUT)
    shutil.copytree(os.path.join(WEB_SRC, "icons"), os.path.join(OUT, "icons"))

    index = os.path.join(OUT, "index.html")
    html = open(index, encoding="utf-8").read()
    assert '<link rel="stylesheet" href="app.css">' in html and '<script src="photos.js"></script>' in html
    html = html.replace('<link rel="stylesheet" href="app.css">', HEAD + '<link rel="stylesheet" href="app.css">')
    html = html.replace('<script src="photos.js"></script>', '<script src="web-bridge.js"></script>\n<script src="photos.js"></script>')
    html = html.replace("</body>", SW + "</body>")
    open(index, "w", encoding="utf-8").write(html)

    files, digest = [], hashlib.sha256()
    for base, _, names in sorted(os.walk(OUT)):
        for n in sorted(names):
            path = os.path.join(base, n)
            rel = os.path.relpath(path, OUT).replace(os.sep, "/")
            files.append(rel)
            digest.update(rel.encode()); digest.update(open(path, "rb").read())
    sw = open(os.path.join(WEB_SRC, "sw.js"), encoding="utf-8").read()
    sw = sw.replace("'__VERSION__'", json.dumps("business-app-" + digest.hexdigest()[:12]))
    sw = sw.replace("__FILES__", json.dumps(["./"] + files))
    open(os.path.join(OUT, "sw.js"), "w", encoding="utf-8").write(sw)
    print("web/ ready:", len(files), "files")


if __name__ == "__main__":
    main()
