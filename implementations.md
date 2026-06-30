### [2026-06-29] - Remove taco-unlock + source-hide gating + cookie freeze
**Status:** PENDING USER VERIFY
**Files:** web: App.jsx, FeedSearch.jsx, AboutPanel.jsx, NewsFeed/NewsCard/ArticleMedia, index.html, package.json, App.css (deleted taco-unlock/, sources/, consent/, CookieConsent.jsx); mobile: FeedScreen.js, AboutScreen.js, App.js, NewsListItem.js, .env.example (deleted taco-unlock/config, SourceVisibilityControls, *Prefs services, sources/visibility-config); added shared/monetization/bmc-config.js.
**Result:** Honor-system taco unlock, hide-sources buttons, and mandatory cookie "freeze" gate removed. Feed search and source names are now ungated/free for everyone. Donation panel kept (no unlock copy). Web build + tests pass.

### 2026-06-29 - Web API timeout (Fly internal_port)
**Status:** PARTIAL (config fixed; redeploy pending)
**Files:** fly.toml, web/vite.config.js
**Result:** Root fly.toml had internal_port=8080 while API listens on 8787; Fly health check critical (connection refused). Fixed to 8787. Vite bound to 127.0.0.1 for Windows /api proxy. Local API :8787 OK; prod needs fly deploy.
