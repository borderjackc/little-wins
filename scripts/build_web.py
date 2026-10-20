#!/usr/bin/env python3
"""Build the installable web app in docs/ from prototype/index.html.

prototype/index.html stays the single source of the app. This wraps it in a full
HTML document with the iOS home-screen tags, manifest and service worker, and
stamps a new cache version so installed copies pick up the change.

    python3 scripts/build_web.py
"""
import hashlib
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "prototype" / "index.html"
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

    version = hashlib.sha256(html.encode()).hexdigest()[:10]
    sw = (ROOT / "scripts" / "sw.template.js").read_text(encoding="utf-8").replace("__VERSION__", version)
    (OUT / "sw.js").write_text(sw, encoding="utf-8")
    print(f"Built docs/index.html and docs/sw.js (cache {version})")


if __name__ == "__main__":
    main()
