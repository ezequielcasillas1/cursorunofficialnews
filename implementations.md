### [2026-07-02] - Website security hardening (website-only scope)
**Status:** SUCCESS
**Files:** web/worker/src/{security/rate-limit.js,security/public-error.js,middleware/require-api-secret.js,routes/core-routes.js,notifications/email-routes.js,notifications/unsubscribe/components/unsubscribe-confirm-form.js,monetization/membership-routes.js,llm/llm-routes.js,app.js}, web/public/_headers, docs/CLOUDFLARE-DEPLOY.md
**Result:** Website-only hardening complete. REGISTER_SECRET optional (push disabled when unset; news/membership/email/Stripe unaffected). Per-IP rate limits on email verify/subscribe/unsubscribe, device register, membership checkout. GET unsubscribe confirm-then-POST. CSP + security headers on static assets; HSTS on API. /v1/llm/* auth-gated. Cloudflare Rate Limiting rule docs + website deploy checklist in CLOUDFLARE-DEPLOY.md. web/ npm audit: 0 vulnerabilities. Mobile changes left uncommitted separately.

### [2026-07-02] - Security audit follow-ups (in-repo)
**Status:** SUCCESS
**Files:** docs/{SECURITY-HARDENING.md,CLOUDFLARE-DEPLOY.md,RUN-LOCAL.md}, env/{server.example.env,web.example.env,mobile.example.env}, web/{public/_headers}, web/worker/src/{notifications/email-routes.js,lib/membership-email-lists.js}
**Result:** Docs for REGISTER_SECRET + EAS secret + Cloudflare rate-limit rules; env templates aligned to cursorunofficial.news/api; CSP on static assets; per-IP verification email rate limits; subscribe/resubscribe IP limits; NEWSLETTER_FREE_EMAILS prod warn. npm audit: web 0 vulns; mobile/root Expo transitive — needs Expo SDK upgrade (user decision).

### [2026-07-02] - Security audit hardening
**Status:** SUPERSEDED (see website-only entry above)
**Files:** web/worker/src/{security/rate-limit.js,security/public-error.js,middleware/require-api-secret.js,routes/core-routes.js,notifications/email-routes.js,notifications/unsubscribe/components/unsubscribe-confirm-form.js,monetization/membership-routes.js,llm/llm-routes.js,app.js}, mobile/src/api/newsClient.js, env/mobile.example.env
**Result:** Required REGISTER_SECRET in production; IP rate limits on device register/checkout/unsubscribe; GET unsubscribe now confirm-then-POST (blocks prefetch/CSRF); token length cap; /v1/llm/status auth-gated; generic prod errors; HSTS header; mobile sends X-API-Secret when EXPO_PUBLIC_REGISTER_SECRET set. n8n workflow HTTP nodes aligned to `https://cursorunofficial.news/api/v1/...`.

### [2026-07-02] - n8n workflow audit fixes
**Status:** SUCCESS
**Files:** docs/n8n/cursor-ai-news-newsletter.workflow.json, docs/n8n/README.md, docs/CLOUDFLARE-DEPLOY.md
**Result:** Exported workflow AWUxJU3oVLNzP2Op with error handling, webhook 202/500 responses, credential refs (no inline secrets), typeVersion bumps. Live import + credential creation required in n8n UI.

### [2026-07-02] - n8n repo export sync (live AWUxJU3oVLNzP2Op)
**Status:** SUCCESS
**Files:** docs/n8n/cursor-ai-news-newsletter.workflow.json, docs/n8n/README.md
**Result:** Synced repo export to published live workflow. Fixed `If Webhook Error Response` unary boolean (`singleValue: true`, removed invalid `rightValue`). Added credential IDs on HTTP nodes to match live. 10 nodes; re-import should match published graph.

### [2026-07-02] - Per-category feed filters (web)
**Status:** PENDING USER VERIFY
**Files:** mobile/shared/feed/categoryFilterPrefs.js, mobile/shared/feed/feedCategories.js, web/src/{App.jsx,App.css,components/CategoryFilter.jsx,components/CategoryFilterPanel.jsx,components/NewsFeed.jsx,feed/filterPrefsStorage.js,feed/categoryFilterPrefs.test.js,services/newsApi.js}, web/worker/src/{store/news-store.js,routes/core-routes.js}
**Result:** Replaced standalone Official only chip with per-tab Section filters panel (official toggle + source chips). Prefs stored in localStorage per category; API accepts `sources` query param. Legacy officialOnly prefs migrate automatically.

### [2026-07-02] - Brand header SVG icons
**Status:** PENDING USER VERIFY
**Files:** web/public/brand/logo-icon.svg, web/public/brand/logo-icon-light.svg, web/src/components/Header.jsx
**Result:** Hand-crafted hex icons (navy/gold/cream dark; light interior + dark N for light theme). Served at `/brand/*.svg` via Vite public. Header `onError` hides broken img.

### [2026-07-02] - Web header icon + text lockup
**Status:** PENDING USER VERIFY
**Files:** web/src/components/Header.jsx, web/src/App.css, web/public/brand/README.md
**Result:** Horizontal masthead lockup: 52px hex icon left, existing h1/rules/tagline right. Theme swaps `logo-icon.svg` / optional `logo-icon-light.svg`. Markup wired; drop SVGs into `web/public/brand/`.

**Status:** PENDING USER VERIFY
**Files:** web/worker/src/db/migrations/001_email_official_only.sql, web/worker/src/db/schema.sql, docs/RUN-LOCAL.md
**Result:** Root cause: code wrote `official_only` but local/production D1 created before schema update lacked the column. Applied migration locally; made SQL idempotent (`ADD COLUMN IF NOT EXISTS`); documented remote command in migration header + RUN-LOCAL.

**Status:** PENDING USER VERIFY
**Files:** web/src/components/newsletter/NewsletterSettings.jsx, web/src/App.css
**Result:** Moved "Official only" from buried bottom-of-topics row to a gold-bordered "Source filter" card above Email topics, matching feed nav chip + tooltip. Root cause: code existed locally (untracked) but was easy to miss below 8 topic cards; web dev server restart required.

### [2026-07-02] - Newsletter Official only option
**Status:** PENDING USER VERIFY
**Files:** mobile/src/config/notifications.js; mobile/src/{services/emailNewsletter.js,screens/NotificationSettingsScreen.js}; web/src/{newsletter/config.js,newsletter/useNewsletter.js,newsletter/services/newsletterApi.js,components/newsletter/NewsletterSettings.jsx}; web/worker/src/{db/schema.sql,db/migrations/001_email_official_only.sql,store/email-subscribers.js,notifications/email-routes.js,shared/notifications/subscriber-digest.js}; digest jobs/assemble paths
**Result:** Added "Official only" newsletter toggle (same label/tooltip as feed nav). Stored as `officialOnly` on subscribers; digest builder filters to `isOfficial` sources when enabled.

### [2026-07-02] - Newsletter email editorial theme
**Status:** PENDING USER VERIFY
**Files:** web/worker/src/notifications/{assemble-email.js,assemble-email.test.js,newsletter-prompt.js}
**Result:** Digest HTML now mirrors site dark editorial design: Bodoni Moda masthead, Libre Caslon tagline, Libre Franklin labels, gold (#d4b87a) accents, double masthead rules, charcoal card (#121218). Shows gold "Official only" badge + intro copy when subscriber filters official sources. 4/4 assemble-email tests pass.

### [2026-07-02] - n8n newsletter grouped digest
**Status:** PENDING USER VERIFY
**Files:** mobile/shared/notifications/category-limits.js; web/worker/src/notifications/{assemble-email.js,newsletter-digest.js,newsletter-export.js,newsletter-routes.js,newsletter-prompt.js}; web/worker/src/jobs/{trigger-n8n-newsletter.js,send-email-digest.js,send-welcome-digest.js}
**Result:** Digest builder groups by enabled topics, caps 1–3 headlines per category, renders N-1 editorial dividers. New API: `POST /v1/newsletter/build-digest` (+ `/test` alias) for n8n preview/send.

**Local test (after `dev:api`, verified subscriber in D1):**
```powershell
curl.exe -s -X POST "http://127.0.0.1:8787/api/v1/newsletter/test" ^
  -H "Content-Type: application/json" ^
  -H "X-API-Secret: YOUR_INGEST_SECRET" ^
  -d "{\"email\":\"72afterda@gmail.com\"}"
```
Add `"send":true` to deliver via Resend. n8n webhook payload now includes `buildDigestUrl` + `testDigestUrl`.

### [2026-07-02] - n8n webhook + membership bypass
**Status:** PENDING USER VERIFY
**Files:** web/worker/src/{lib/membership-email-lists.js,lib/membership-entitlement.js,jobs/trigger-n8n-newsletter.js,store/memberships.js,notifications/email-routes.js,monetization/membership-routes.js}; web/src/monetization/{config.js,useMembership.js}; env/{server.example.env,web.example.env,README.md}; wrangler.jsonc; docs/CLOUDFLARE-DEPLOY.md
**Result:** Single `N8N_NEWSLETTER_WEBHOOK_URL` only (no TARGET/_TEST/_PROD vars). Local bypass + prod free-email whitelist for newsletter.

**Local test (`env/server/.env` + `env/web/.env`, then restart `dev:api` + `dev:web`):**
```
N8N_NEWSLETTER_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook-test/cursor-newsletter
N8N_NEWSLETTER_MODE=parallel
DEV_BYPASS_MEMBERSHIP=true
MEMBERSHIP_DEV_EMAILS=you@example.com
PUBLIC_WEB_BASE=http://127.0.0.1:5173
PUBLIC_API_BASE=http://127.0.0.1:8787/api
```
```
VITE_MEMBERSHIP_DEV_ACTIVE=true
VITE_MEMBERSHIP_DEV_EMAIL=you@example.com
```
Prod: `npx wrangler secret put N8N_NEWSLETTER_WEBHOOK_URL` with live `/webhook/` URL (same var name).

### [2026-06-30] - Feed pagination (30 per page)
**Status:** PENDING USER VERIFY
**Files:** mobile/shared/feed/feedPagination.js; mobile/server/src/{index,store/memory-cache}.js; mobile/server/test/{feed-pagination,memory-cache}.test.js; web/src/{config/feedCategories,services/newsApi}.js; mobile/src/{api/newsClient,config/constants,screens/FeedScreen}.js
**Result:** Shared FEED_PAGE_SIZE=30. GET /v1/news returns page, pageSize, total, totalPages, hasMore. Web paginates per tab; mobile fetches page 1 (30 items). 33/33 server tests, 9/9 web tests, web build OK.

### [2026-06-30] - Feed policy + website ingest alignment (2025 cut)
**Status:** PENDING USER VERIFY
**Files:** mobile/shared/feed/{feedPolicy,feedCategories}.js; mobile/server/src/{ingest/feeds,store/memory-cache,index}.js; mobile/src/config/constants.js; web/src/{config/feedCategories,App.jsx,components/AboutPanel.jsx}; mobile/server/test/{feed-policy,memory-cache}.test.js
**Result:** Shared feed policy enforces 2025-01-01 cut at ingest + API store. Tab→category mapping consolidated in shared feedCategories. Web status bar shows cut year; GET /v1/status exposes feedPublishedAfter. 26/26 server tests pass; web build OK.

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

### [2026-07-02] - Root npm run dev (api + web)
**Status:** PENDING USER VERIFY
**Files:** package.json, package-lock.json
**Result:** Added \dev\ script via concurrently (-n api,web) running dev:api and dev:web in parallel. devDependency concurrently ^9.1.2 installed.

