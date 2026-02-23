# BrainFlow

BrainFlow is a modern floating focus widget for browser tabs, designed for ADHD-friendly work sessions.

## What it does

- Floating draggable widget on any page
- Focus/Break timer modes: `10/3` and `15/5`
- Start / Pause / Reset flow with persisted state
- Collapsed compact timer mode
- Task completion tracking with daily progress
- Procrastination interceptor (domain change + inactivity reminder)
- RU/EN interface
- 4 visual themes:
  - `calm_teal`
  - `deep_blue`
  - `soft_amber`
  - `mono`
- Built-in stats page with monthly calendar and streak
- Settings page (language, theme, default mode, signals, interceptor)
- Local-only data storage (`chrome.storage.local`)

## Browser support

- Chrome / Edge (Manifest V3)
- Safari (via official Safari Web Extension conversion)

## Install for development (Chrome)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select project folder:
   - `/Users/WorkShop/QA/ BrainFlow`

## Safari conversion

Use Apple official converter:

```bash
xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"
```

Then:

1. Open generated Xcode project
2. Configure Team and signing
3. Build and run
4. Enable extension in Safari settings

## Project structure

- `manifest.json` — extension manifest (MV3)
- `src/content.js` / `src/content.css` — widget logic and styles on pages
- `src/background.js` — service worker, tab/events integration
- `src/popup.*` — browser action popup
- `src/options/*` — settings UI
- `src/stats.*` — statistics and calendar UI
- `assets/icons/*` — extension icons
- `tools/release-check.js` — release sanity check script
- `store/*` — store listing materials (RU/EN)
- `PRIVACY_POLICY.md` — privacy policy
- `RELEASE_CHECKLIST.md` — manual QA checklist

## Release checks

Run automated release validation:

```bash
node tools/release-check.js
```

Use manual checklist:

- `RELEASE_CHECKLIST.md`

## Build ZIP for store upload

Example command from project root:

```bash
zip -r BrainFlow-v1.0.0.zip . -x "*.git*" "*.DS_Store" "*.zip"
```

## Privacy

BrainFlow does not send user data to external servers.
All settings and stats are stored locally in browser storage.

Details: `PRIVACY_POLICY.md`

## Store submission materials

- `store/GO_LIVE.md`
- `store/CHROME_LISTING_RU.md`
- `store/CHROME_LISTING_EN.md`
