# Little Wins

Track the habits you care about, let your person cheer you on, and build a shared history of small wins, doodles and daily notes.

A private, warm habit app for couples. Its main job is to make encouraging each other effortless. Missed days are never punished, and the shared Timeline becomes a printable year book.

## What's here

| Path | What it is |
|---|---|
| [`app/`](app/) | The real two-person app: real setup with an invite link, and everything synced between both phones through Firebase ([`sync.js`](app/sync.js)). |
| [`firestore.rules`](firestore.rules) | Database rules: only the two phones that joined with the invite link can read or write your space. |
| [`prototype/index.html`](prototype/index.html) | Clickable single-file demo prototype with sample data. |
| [`docs/`](docs/) | Installable web app (PWA) built from `app/`, served by GitHub Pages at https://borderjackc.github.io/little-wins/ |
| [`spec/habit-app-prd.md`](spec/habit-app-prd.md) | One-page PRD (v1): who it's for, the encouragement loop, core concepts and decisions. |

## Run the prototype

```bash
open prototype/index.html      # macOS
# or just double-click the file
```

## Use it on iPhone

1. Open https://borderjackc.github.io/little-wins/ in **Safari**.
2. Tap **Share**, then **Add to Home Screen**, then **Add**.

It opens full screen with its own icon. One of you taps **Create our space** and shares the invite link; the other opens their installed app, taps **I have an invite link** and pastes it. Changes made offline sync when the phone is back online.

## Update the web app

Edit `app/index.html` or `app/sync.js`, then rebuild and push:

```bash
python3 scripts/build_web.py
```

This regenerates `docs/` with a new cache version, so installed copies update next time they open.

## Test sync locally

Run the Firebase emulators (`npx firebase-tools emulators:start --project demo-little-wins --only auth,firestore`), build with `python3 scripts/build_web.py --allow-placeholder`, swap in a `demo-little-wins` config, serve `docs/` and open it with `?emulator` in two browser profiles.

## Status

v1 web app for two people. Partner alerts show as banners while the app is open; real push notifications and the PDF year book come later.
