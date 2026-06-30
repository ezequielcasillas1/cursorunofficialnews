### [2026-06-30] - Issue + Discussion category tabs
**Status:** PENDING USER VERIFY
**Files:** mobile/server/src/classify/{content-signals,classify-news-item,index}.js, test/classify-news-item.test.js; mobile/shared/notifications/constants.js; mobile/src/{config/constants.js,components/NewsListItem.js,screens/AboutScreen.js}; web/src/{config/feedCategories.js,utils/articleMedia.js}
**Result:** Classifier now promotes bug/broken/uninstall posts to `issue` and opinion/roundup pieces to `discussion`. Two new feed tabs (Issues, Discussion) added to mobile + web; 14/14 unit tests pass.

### [2026-06-30] - Feed category classifier service layer
**Status:** PENDING USER VERIFY
**Files:** mobile/server/src/classify/{index,classify-news-item,url-rules,content-signals}.js, normalize/news-item.js, store/memory-cache.js, sources/registry.js, test/classify-news-item.test.js
**Result:** URL-first + content-heuristic classifier routes forum.cursor.com → forum, docs/learn → tutorial, SO/discussions → community; dev.to opinion vs how-to split. Applied at ingest normalize + cache sanitize.

### [2026-06-30] - LM Studio local LLM integration
**Status:** PENDING USER VERIFY
**Files:** mobile/server/src/llm/{config,lm-studio-client,llm-routes}.js, scripts/test-lm-studio.js, .env.example, package.json; docs/LM-STUDIO.md, docs/AGENT-CONTEXT.md
**Result:** OpenAI-compatible LM Studio client (default http://127.0.0.1:1234/v1). Env: LM_STUDIO_BASE_URL, LM_STUDIO_MODEL, LM_STUDIO_API_KEY, LM_STUDIO_TIMEOUT_MS. Routes: GET /v1/llm/status, POST /v1/llm/chat, POST /v1/llm/summarize. npm run llm:test + docs/LM-STUDIO.md for setup.

### [2026-06-29] - Remove taco-unlock + source-hide gating + cookie freeze
**Status:** SUCCESS
**Files:** web: App.jsx, FeedSearch.jsx, AboutPanel.jsx, NewsFeed/NewsCard/ArticleMedia, index.html, package.json, App.css (deleted taco-unlock/, sources/, consent/, CookieConsent.jsx); mobile: FeedScreen.js, AboutScreen.js, App.js, NewsListItem.js, .env.example (deleted taco-unlock/config, SourceVisibilityControls, *Prefs services, sources/visibility-config); added shared/monetization/bmc-config.js.
**Result:** User verified. Commit 6b8bb76 on main. Honor-system unlock, source-hide, and cookie freeze removed; search/sources ungated for everyone. request.md notes future subscription-gated rebuild.

### 2026-06-29 - Web API timeout (Fly internal_port)
**Status:** SUCCESS
**Files:** fly.toml, web/vite.config.js
**Result:** Config fix in 6b8bb76 (internal_port=8787). User confirmed manual Fly redeploy restored /api.
