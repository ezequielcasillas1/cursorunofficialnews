### [2026-06-29] - Post-unhide sources navigation hint
**Status:** PENDING USER VERIFY
**Files:** web/src/components/sources/SourceVisibilityControls.jsx, web/src/App.jsx, web/src/components/AboutPanel.jsx, web/src/sources/scrollToSourcesSection.js, web/src/App.css, mobile/shared/taco-unlock/config.js, mobile/src/components/SourceVisibilityControls.js, mobile/src/screens/FeedScreen.js, mobile/src/screens/AboutScreen.js, mobile/App.js
**Result:** After unlock, hint notes sources at page bottom; web "Go to sources ↓" scrolls to #sources-section; mobile "Open About →" opens About and scrolls to Sources.

### [2026-06-29] - Cookie consent gate + source-hide race fix
**Status:** PENDING USER VERIFY
**Files:** web/src/App.jsx, web/src/consent/storage.js, web/src/taco-unlock/useTacoUnlock.js, web/index.html, web/src/App.css, mobile/src/screens/FeedScreen.js
**Result:** Feed/API blocked until dual cookie+localStorage consent; taco prefs load only after consent; sources default hidden until prefs load (fail-safe).
