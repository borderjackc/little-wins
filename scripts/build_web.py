#!/usr/bin/env python3
"""Build the installable web app in docs/ from app/.

app/index.html is the source of the real two-person app (prototype/ keeps the demo). This wraps it in a full
HTML document with the iOS home-screen tags, manifest and service worker, and
stamps a new cache version so installed copies pick up the change.

    python3 scripts/build_web.py
"""
import hashlib
import json
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = ROOT / "app"
SRC = APP / "index.html"
OUT = ROOT / "docs"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Little Wins">
<meta name="theme-color" content="#EEF7FD" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
"""

# Full-screen on iPhone: keep content clear of the notch, status bar and home indicator.
SAFE_AREA = """<style>
html,body{margin:0;overscroll-behavior:none}
.app{padding-top:env(safe-area-inset-top,0px)}
nav{padding-bottom:max(6px,env(safe-area-inset-bottom,0px))}
.sheet{padding-bottom:calc(24px + env(safe-area-inset-bottom,0px))}
.onb{padding-top:calc(28px + env(safe-area-inset-top,0px));padding-bottom:calc(28px + env(safe-area-inset-bottom,0px))}
#toast{bottom:calc(86px + env(safe-area-inset-bottom,0px))}
</style>
"""

SW = """<script>
if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js'));
}
</script>
"""


def main():
    src = SRC.read_text(encoding="utf-8")
    # Drop the prototype's own viewport tag; the PWA head sets its own.
    lines = [l for l in src.splitlines(keepends=True) if 'name="claude:viewport-fit-sides"' not in l]
    body_start = next(i for i, l in enumerate(lines) if l.lstrip().startswith("<div") and 'class="app"' in l)
    head_part, body_part = "".join(lines[:body_start]), "".join(lines[body_start:])

    html = HEAD + head_part + SAFE_AREA + "</head>\n<body>\n" + body_part + SW + "</body>\n</html>\n"
    (OUT / "index.html").write_text(html, encoding="utf-8")

    config = (APP / "firebase-config.js").read_text(encoding="utf-8")
    if "PASTE_" in config and "--allow-placeholder" not in sys.argv:
        sys.exit("app/firebase-config.js still has placeholders. Paste the Firebase web config first.")

    for f in ["sync.js", "firebase-config.js"]:
        shutil.copy(APP / f, OUT / f)
    shutil.copytree(APP / "vendor", OUT / "vendor", dirs_exist_ok=True)

    shell = ["./", "index.html", "manifest.webmanifest", "sync.js", "firebase-config.js",
             "vendor/firebase-app.js", "vendor/firebase-auth.js", "vendor/firebase-firestore.js",
             "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"]
    digest = hashlib.sha256(html.encode())
    for f in shell[3:]:
        digest.update((OUT / f).read_bytes())
    version = digest.hexdigest()[:10]
    sw = (ROOT / "scripts" / "sw.template.js").read_text(encoding="utf-8")
    sw = sw.replace("__VERSION__", version).replace("__SHELL__", json.dumps(shell))
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    print(f"Built docs/index.html and docs/sw.js (cache {version})")


if __name__ == "__main__":
    main()
