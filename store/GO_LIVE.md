# BrainFlow Go-Live (What is done vs what is left)

## Done in code
- MV3 extension architecture is implemented.
- Core product flow is implemented: timer, reward row, interceptor, stats, settings.
- RU/EN localization is implemented.
- 4-theme system is implemented across widget/popup/options/stats.
- Persistent storage is local only (`storage.local`).
- Icons and privacy policy are in repository.
- Release validator script is added: `tools/release-check.js`.

## Verified locally (automated)
- JavaScript syntax checks pass.
- Manifest structure and required files can be validated with:
  - `node tools/release-check.js`

## Manual steps required before publish
1. Run full smoke test in Chrome and Edge (real user flows).
2. Take store screenshots for all main screens.
3. Fill Chrome Web Store listing metadata.
4. Upload zip package and complete Data usage form.
5. For Safari: convert in Xcode and submit via App Store Connect.

## Hard blockers to publish
- None in code at this moment (based on static checks).
- Remaining work is store QA and submission workflow.
