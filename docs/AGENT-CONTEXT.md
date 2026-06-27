# Agent Context — Cold Start

Everything a new chat needs. **This is Cursor AI News — NOT PasteCraft.**

| | |
|---|---|
| **Root** | `C:\Dev\CursorAINews` |
| **Repo** | `github.com/ezequielcasillas1/cursorunofficialnews` |
| **Product** | Unofficial Cursor News — fan app, not affiliated with Anysphere |
| **Brand copy** | Say **Cursor** (not "Cursor AI") when citing the tool |

---

## Do NOT use PasteCraft

| Wrong | Right |
|---|---|
| `C:\Dev\PasteCraft\` | `C:\Dev\CursorAINews\` |
| `extension/`, merchant, clips, Supabase sync | `mobile/`, `mobile/server/`, `web/` |
| PasteCraft `request.md` / `refresh.md` | `docs/CURSOR-AI-NEWS-PHASE-PLAN.md` |

---

## Stack

| Layer | Path | Port / notes |
|---|---|---|
| App (Expo + API) | `mobile/` | Expo Dev Client — **primary client** |
| API server | `mobile/server/` | Express `:8787` — ingest, normalize, JSON |
| Web | `web/` | React + Vite `:5173` — dev proxy to API; prod → [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) |

Modularity: registry → ingest → normalize → store → routes → client. Vertical slices per phase.

---

## Run (Windows PowerShell)

```powershell
cd C:\Dev\CursorAINews\mobile\server; npm install; npm run dev

cd C:\Dev\CursorAINews\mobile; npm install; npx expo start --dev-client
```

From repo root (after `npm install` in `mobile/server`, `mobile/`, and `web/`):

```powershell
npm run dev:api      # API on :8787
npm run dev:mobile   # Expo dev client
npm run dev:web      # Web preview on :5173 (proxies /api → :8787)
```

First Android native build (once): `npx expo run:android` from `mobile/`.

API health: `http://127.0.0.1:8787/health`  
Ingest: `POST http://127.0.0.1:8787/v1/ingest`  
Feed: `GET http://127.0.0.1:8787/v1/news`

---

## Physical Android → local API

| Method | Command / config |
|---|---|
| USB reverse | `adb reverse tcp:8787 tcp:8787` |
| LAN IP | `EXPO_PUBLIC_API_BASE=http://192.168.x.x:8787` before Expo start (see `mobile/.env.example`) |
| Emulator | Default `http://10.0.2.2:8787` in `mobile/src/config/constants.js` |

Client: `mobile/src/api/newsClient.js` · config: `mobile/app.config.js`

---

## Zscaler / corporate TLS

Outbound RSS fetch needs system CA: `node --use-system-ca` (already in `mobile/server/package.json` `dev`/`start` scripts).

---

## Phase plan & rules

1. **[CURSOR-AI-NEWS-PHASE-PLAN.md](CURSOR-AI-NEWS-PHASE-PLAN.md)** — scope, verify steps, status checkboxes
2. **`.cursor/rules/unofficial-cursor-news-feed-service.mdc`** — phases 1–7 detail
3. **`.cursor/rules/cursor-ai-news-project-root.mdc`** — workspace routing (alwaysApply)

One phase at a time. Do not skip ahead unless user approves.

---

## Phase 1 — status

| Item | Status |
|---|---|
| Changelog RSS URL | Done → `https://cursor.com/changelog/rss.xml` (`mobile/server/src/sources/registry.js`) |
| API ingest (~50 changelog items) | Done — bootstrap on startup + `POST /v1/ingest` |
| Zscaler TLS | Done (`node --use-system-ca` in `mobile/server/package.json` `dev`/`start`) |
| GitHub releases Atom | Upstream empty — `getcursor/cursor/releases.atom` (not a local bug) |
| Mobile feed on device | Done — user confirmed feed loading (adb reverse or `EXPO_PUBLIC_API_BASE`) |
| Phase 1 SUCCESS log | Done — `success/SuccessLog.md` (2026-06-26) |

---

## Phase 2 — current status

| Item | Status |
|---|---|
| `dedupeNewsItems` by canonical URL | Done — `mobile/server/src/normalize/news-item.js` |
| Official source wins on duplicate | Done — `isOfficial` + `priority` in registry |
| Sort by `publishedAt` desc | Done — ingest + `getNews` |
| `GET /v1/sources` metadata | Done — `listSourcesForApi()` |
| Phase 2 SUCCESS log | Done — `success/SuccessLog.md` (2026-06-26) |

---

## Phase 3 — current status

| Item | Status |
|---|---|
| Forum announcements RSS | Done — `cursor-forum-announcements` in registry |
| Scrape ingest path | Done — `mobile/server/src/ingest/scrape.js` (env-gated) |
| Blog scrape source | Done — `cursor-blog-scrape` (needs `SCRAPE_API_*` env) |
| Releasebot aggregator | Disabled — no working RSS; `enabled: false` |
| ≥2 ingest methods | Done — RSS/Atom + scrape |
| Phase 3 SUCCESS log | Done — `success/SuccessLog.md` (2026-06-27) |

---

## Known dev blockers (may vary by machine)

- `JAVA_HOME` / Android SDK for `expo run:android`
- USB debugging / adb not in PATH
- Expo prebuild `fetch failed` (network/SSL)

---

## Production deploy

| Layer | Host | Doc |
|---|---|---|
| API | Fly.io `cursorunofficialnews.fly.dev` | [FLY-DEPLOY.md](FLY-DEPLOY.md) |
| Web | Cloudflare Pages `cursorunofficial.news` | [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) |
| Email (Resend) | Fly secrets + Resend domain verify | [FLY-DEPLOY.md](FLY-DEPLOY.md) — separate from Pages |

Deploy API first; set `VITE_API_BASE=https://cursorunofficialnews.fly.dev` in Cloudflare Pages build env.

---

## Do not (any phase)

- Edit PasteCraft for this product
- Republish full articles or paywalled content
- Ship without disclaimer + attribution on every item
- Assume production deploy is live unless user confirms dashboard steps are done
