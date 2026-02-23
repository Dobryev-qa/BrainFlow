# BrainFlow Extension

BrainFlow is a floating focus widget browser extension for ADHD-friendly work sessions.

## Platforms
- Chrome / Edge (Manifest V3)
- Safari (via Safari Web Extension conversion)

## Features
- Floating draggable widget on all pages
- Timer modes: 10/3 and 15/5 (work/break)
- Start/Pause/Reset with persisted state
- Task reward line (brains)
- Procrastination interceptor (domain change + inactivity)
- RU/EN language support
- 4 visual themes (Calm Teal, Deep Blue Focus, Soft Amber, Monochrome)
- Local stats page and settings page
- Local-only data storage (`storage.local`)

## Load in Chrome
1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click **Load unpacked**.
4. Select `/Users/WorkShop/QA/ BrainFlow`.

## Safari conversion (official Apple flow)
1. Run:
   ```bash
   xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"
   ```
2. Open generated Xcode project.
3. Configure Team + signing.
4. Build and run.
5. Enable extension in Safari settings.

## Data and privacy
See `PRIVACY_POLICY.md`.

## Pre-release checks
See `RELEASE_CHECKLIST.md`.

Automated release validation:
```bash
node tools/release-check.js
```

Store submission docs:
- `store/GO_LIVE.md`
- `store/CHROME_LISTING_RU.md`
- `store/CHROME_LISTING_EN.md`
