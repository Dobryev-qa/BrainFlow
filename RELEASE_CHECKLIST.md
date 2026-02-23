# BrainFlow Release Checklist

## 1. Functional QA
- [ ] Timer modes: 10/3 and 15/5
- [ ] Start / Pause / Reset behavior
- [ ] Widget drag and persisted position
- [ ] Collapse/expand behavior
- [ ] "Task done" increments brains correctly
- [ ] Domain-change interceptor triggers only while timer runs
- [ ] 3-minute inactivity interceptor trigger works
- [ ] RU/EN switch in widget
- [ ] Settings page save/load
- [ ] Stats page values and streak calculation

## 2. Browser QA
- [ ] Chrome stable (latest)
- [ ] Edge stable (latest)
- [ ] Safari latest on macOS (converted project build)

## 3. Security & permissions
- [ ] Only required permissions in manifest (`storage`, `tabs`)
- [ ] No remote code
- [ ] No external network calls

## 4. Store assets
- [ ] Extension name and short description
- [ ] Detailed description (RU/EN)
- [ ] Screenshots (widget + stats + settings)
- [ ] Privacy policy URL/file content
- [ ] Support email and homepage

## 5. Chrome Web Store package
- [ ] Zip folder contents from project root
- [ ] Validate in Chrome Extensions page (no runtime errors)
- [ ] Upload and fill Data Usage form

## 6. Safari package
- [ ] Run `xcrun safari-web-extension-converter "/Users/WorkShop/QA/ BrainFlow"`
- [ ] Configure signing in Xcode
- [ ] Build and archive app containing extension
- [ ] Submit via App Store Connect
