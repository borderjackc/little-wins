# Little Wins

Track the habits you care about, let your person cheer you on, and build a shared history of small wins, doodles and daily notes.

A private, warm habit app for couples. Its main job is to make encouraging each other effortless. Missed days are never punished, and the shared Timeline becomes a printable year book.

## What's here

| Path | What it is |
|---|---|
| [`prototype/index.html`](prototype/index.html) | Clickable single-file prototype (baby blue and yellow theme, jokes section). Open it in any browser, no build step. |
| [`docs/`](docs/) | Installable web app (PWA) built from the prototype, served by GitHub Pages at https://borderjackc.github.io/little-wins/ |
| [`spec/habit-app-prd.md`](spec/habit-app-prd.md) | One-page PRD (v1): who it's for, the encouragement loop, core concepts and decisions. |

## Run the prototype

```bash
open prototype/index.html      # macOS
# or just double-click the file
```

## Use it on iPhone

1. Open https://borderjackc.github.io/little-wins/ in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.

It opens full screen with its own icon and works offline. Data is saved on the phone only.

## Update the web app

Edit `prototype/index.html`, then rebuild and push:

```bash
python3 scripts/build_web.py
```

This regenerates `docs/` with a new cache version, so installed copies update next time they open.

## Status

v1 prototype, to be tested as a web app with two users before a native iOS build.
