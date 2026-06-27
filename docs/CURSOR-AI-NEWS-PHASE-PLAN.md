# Cursor AI News — Phase Plan

**Root:** `C:\Dev\CursorAINews` · **NOT** PasteCraft  
**Product:** Unofficial Cursor News (not affiliated with Anysphere)  
**Stack:** `api/` + `mobile/` (primary) + `web/` (legacy preview)

**Agents:** read [`AGENT-CONTEXT.md`](AGENT-CONTEXT.md) first · one phase at a time · ask **"Ezequiel, is the implementation successful?"** before SUCCESS logs or commit.

Detail rules: [`.cursor/rules/unofficial-cursor-news-feed-service.mdc`](../.cursor/rules/unofficial-cursor-news-feed-service.mdc)

---

## Architecture (all phases)

`registry.js` → `ingest/` → `normalize/news-item.js` → `store/` → `index.js` → `mobile/` or `web/` → tap opens original URL

Ethics: title + excerpt (≤300 chars) + canonical URL + attribution. Never full article body in-app.

---

## Phase 0 — Foundation

- [x] **Goal:** Standalone repo, dev layout, strategy docs, `.cursor/rules/`
- **Key files:** `README.md`, `docs/SOURCE-STRATEGY.md`, `docs/WEEK-PLAN.md`, `.cursor/rules/cursor-ai-news-project-root.mdc`
- **Verify:** Folder opens in Cursor at `C:\Dev\CursorAINews`; GitHub `cursorunofficialnews`

---

## Phase 1 — Core feed (official sources)

- [x] **Goal:** Changelog RSS + GitHub releases → JSON API → Expo feed → open original + disclaimer
- **Key files:** `api/src/sources/registry.js`, `api/src/ingest/feeds.js`, `api/src/index.js`, `mobile/src/screens/FeedScreen.js`, `mobile/src/api/newsClient.js`
- **Verify:** `POST /v1/ingest` returns items; `GET /v1/news` lists them; mobile refresh shows cards; tap opens valid URL; disclaimer visible
- **Status:** Complete — API live (~50 changelog items); mobile feed confirmed on device; bootstrap ingest on empty cache
- **Fixed:** RSS URL → `https://cursor.com/changelog/rss.xml`; Zscaler TLS → `--use-system-ca`; physical Android → `adb reverse` or `EXPO_PUBLIC_API_BASE`
- **Known:** GitHub releases Atom upstream empty (not a local bug). SUCCESS logged in `success/SuccessLog.md`.

---

## Phase 2 — Dedupe + registry quality

- [x] **Goal:** One timeline — duplicate stories appear once; official source wins
- **Key files:** `api/src/normalize/news-item.js`, `api/src/store/memory-cache.js`, `api/src/sources/registry.js`, `mobile/src/screens/AboutScreen.js`, `mobile/src/components/NewsListItem.js`
- **Verify:** Same URL from two sources → one card; sorted by `publishedAt` desc; `GET /v1/sources` shows metadata; feed cards show Official badge; About lists sources from API
- **Status:** Implemented — backend dedupe + minimal mobile UX (official badges, Phase 2 About section, sources list); awaits user sign-off

---

## Phase 3 — Expand coverage (four ingest paths)

- [x] **Goal:** More Cursor sources via RSS, scrape fallback, registry rows, aggregators (one at a time)
- **Key files:** `api/src/ingest/scrape.js`, `api/src/sources/registry.js`, `docs/SOURCE-STRATEGY.md`
- **Verify:** ≥2 ingest methods live; each source has `ingestMethod`, `attributionLabel`, `maxExcerptChars`
- **Status:** Complete — forum announcements RSS enabled; scrape path env-gated (`SCRAPE_API_URL`/`SCRAPE_API_KEY`); Releasebot disabled until RSS verified. SUCCESS logged in `success/SuccessLog.md`.

---

## Phase 4 — UX essentials (functional, not beautiful)

- [ ] **Goal:** Daily-usable reader — filters, loading/error/empty, About, API-down hints
- **Key files:** `mobile/src/screens/FeedScreen.js`, `mobile/src/screens/AboutScreen.js`, `web/src/components/CategoryFilter.jsx`
- **Verify:** Filter All/Changelog/Releases/Blog/Forum; refresh + error states; unofficial notice in About

---

## Phase 5 — Notifications

- [ ] **Goal:** Opt-in alerts when **new** items appear (per-category toggles)
- **Key files:** `api/src/jobs/` (new), device token endpoint, Expo push or web push via `web/`
- **Verify:** New changelog item triggers subscribed notification; mute/opt-out works; no duplicate spam

---

## Phase 6 — Membership ($1–$5/mo)

- [ ] **Goal:** Optional support — **core feed stays free**; paid = filters/saved/instant notify only
- **Key files:** Stripe/web billing (server-side secrets only); gate convenience, never headlines
- **Verify:** Free users keep full feed; members get extras only; store IAP rules respected

---

## Phase 7 — Ship web + PWA + production API

- [ ] **Goal:** Public URL, scheduled ingest, PWA add-to-home-screen, privacy/DMCA pages
- **Key files:** deploy `api/` + EAS/`web/` build; env `API_BASE`; PWA manifest; legal pages
- **Verify:** Public URL on phone browser; prod ingest on schedule; disclaimer on every item

---

## Windows dev commands

```powershell
cd C:\Dev\CursorAINews\api; npm install; npm run dev
# separate terminal:
cd C:\Dev\CursorAINews\mobile; npm install; npx expo start --dev-client
# physical Android:
adb reverse tcp:8787 tcp:8787
```

API: `http://127.0.0.1:8787`
