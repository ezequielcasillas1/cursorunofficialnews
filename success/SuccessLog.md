### [July 1, 2026] - n8n newsletter E2E (Cloud + news-api)
**Status:** SUCCESS
**Files:** env/server/.env, mobile/server/n8n/cursor-ai-news-newsletter.json, mobile/server/src/notifications/newsletter-routes.js
**Result:** Full n8n chain green (Fetch → Generate HTML → Resend); digest delivered to ezequielcasillas1@gmail.com. Fixed fly.dev 404 → news-api URL; CURSOR_API_KEY required server restart (env not hot-reloaded).

### [June 30, 2026] - Discussion tab classification + scrape pagination support
**Status:** SUCCESS
**Files:** mobile/server/src/classify/classify-news-item.js, content-signals.js, url-rules.js, ingest/scrape.js, test/classify-news-item.test.js
**Result:** Discussion items increased from ~2 to ~23 after relaxing classification threshold and broadening signals; optional multi-page scrape support added.

### [2026-06-29] - Remove taco-unlock + source-hide gating + cookie freeze
**Status:** SUCCESS
**Files:** web App.jsx, FeedSearch, AboutPanel, NewsFeed/NewsCard/ArticleMedia; mobile FeedScreen, AboutScreen, App.js; deleted taco-unlock/consent/source-hide modules; shared/monetization/bmc-config.js
**Result:** Commit 6b8bb76 on main. Honor-system unlock, source-hide, and cookie freeze removed; search/sources ungated for everyone. request.md notes future subscription-gated rebuild.

### [2026-06-29] - Web API timeout (Fly internal_port)
**Status:** SUCCESS
**Files:** fly.toml, web/vite.config.js
**Result:** Config fix in 6b8bb76 (internal_port=8787). User confirmed manual Fly redeploy restored /api.

### [2026-06-26] - Phase 1 vertical slice
**Status:** SUCCESS
**Files:** [api/src/sources/registry.js, api/package.json, api/src/index.js, api/src/ingest/feeds.js, api/src/normalize/news-item.js, api/src/store/memory-cache.js, mobile/src/config/constants.js, mobile/src/screens/FeedScreen.js, docs/AGENT-CONTEXT.md, docs/CURSOR-AI-NEWS-PHASE-PLAN.md]
**Result:** Changelog RSS ingest live (~50 items); bootstrap on empty cache; mobile feed confirmed on device; Zscaler TLS via --use-system-ca; adb reverse / EXPO_PUBLIC_API_BASE for physical Android.

### [2026-06-26] - Phase 2 dedupe + registry quality
**Status:** SUCCESS
**Files:** [api/src/normalize/news-item.js, api/src/store/memory-cache.js, api/src/sources/registry.js, mobile/src/screens/AboutScreen.js, mobile/src/components/NewsListItem.js, mobile/src/components/SourceOfficialBadge.js]
**Result:** Dedupe by canonical URL with official source winning; sorted timeline; GET /v1/sources metadata; mobile Official badges and About sources list.

### [2026-06-27] - Phase 3 expand coverage
**Status:** SUCCESS
**Files:** [api/src/ingest/scrape.js, api/src/ingest/feeds.js, api/src/sources/registry.js, docs/SOURCE-STRATEGY.md, docs/CURSOR-AI-NEWS-PHASE-PLAN.md, docs/AGENT-CONTEXT.md]
**Result:** Forum announcements RSS live; scrape ingest path env-gated (SCRAPE_API_URL/KEY); blog scrape source registered; >=2 ingest methods (RSS/Atom + scrape); Releasebot disabled until RSS verified.

### [2026-06-29] - BMC tier 404 fallback + AdSense slot config
**Status:** SUCCESS
**Files:** docs/BMC-GO-LIVE.md, docs/CLOUDFLARE-DEPLOY.md, web/.env.example, web/src/components/AdSlot.jsx, web/src/components/monetization/AdSenseSlot.jsx, web/src/components/monetization/MonetizationSection.jsx, web/src/config.js, web/src/monetization/config.js
**Result:** User confirmed BMC membership checkout and site monetization work. Commit acc7e8b pushed to main. Tier buttons no longer 404; $5 Supporter tier live on BMC; ad-free email claim flow working.

### [2026-06-29] - Community/social sources + web section filters
**Status:** SUCCESS
**Files:** mobile/server/src/sources/registry.js, mobile/server/src/ingest/feeds.js, mobile/server/src/ingest/twitter-api.js, mobile/server/.env.example, web/src/config/feedCategories.js, web/src/components/CategoryFilter.jsx, web/src/App.jsx, web/src/services/newsApi.js, web/src/components/NewsFeed.jsx, web/src/App.css, mobile/src/config/constants.js, mobile/src/config/notifications.js
**Result:** User confirmed Community and Social tabs work on cursorunofficial.news. Reddit/HN/X sources ingested on Fly (46f05b4); web Sections + Official only aligned with Android; Fly deploy + ingest live.

### [2026-06-29] - Reddit revert to Community category
**Status:** SUCCESS
**Files:** mobile/server/src/sources/registry.js, mobile/src/config/notifications.js
**Result:** Reddit sources use community category again; mobile notification category descriptions match Community vs Social split.

### [2026-06-29] - Newsletter beta disclaimer + production email verified
**Status:** SUCCESS
**Files:** [web/src/components/newsletter/NewsletterSettings.jsx, web/src/App.css, mobile/server/AGENT-CONTEXT.md]
**Result:** Web digest panel shows beta copy; user verified Resend/Fly pipeline sends; AGENT-CONTEXT documents Fly newsletter secrets.
