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
| `extension/`, merchant, clips, Supabase sync | `api/`, `mobile/`, `web/` |
| PasteCraft `request.md` / `refresh.md` | `docs/CURSOR-AI-NEWS-PHASE-PLAN.md` |

---

## Stack

| Layer | Path | Port / notes |
|---|---|---|
| API | `api/` | Express `:8787` — ingest, normalize, JSON |
| Mobile | `mobile/` | Expo Dev Client — **primary client** |
| Web | `web/` | React + Vite — legacy preview |

Modularity: registry → ingest → normalize → store → routes → client. Vertical slices per phase.

---

## Run (Windows PowerShell)

```powershell
cd C:\Dev\CursorAINews\api; npm install; npm run dev

cd C:\Dev\CursorAINews\mobile; npm install; npx expo start --dev-client
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

Outbound RSS fetch needs system CA: `node --use-system-ca` (already in `api/package.json` `dev`/`start` scripts).

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
| Changelog RSS URL | Done → `https://cursor.com/changelog/rss.xml` (`api/src/sources/registry.js`) |
| API ingest (~50 changelog items) | Done — bootstrap on startup + `POST /v1/ingest` |
| Zscaler TLS | Done (`node --use-system-ca` in `api/package.json` `dev`/`start`) |
| GitHub releases Atom | Upstream empty — `getcursor/cursor/releases.atom` (not a local bug) |
| Mobile feed on device | Done — user confirmed feed loading (adb reverse or `EXPO_PUBLIC_API_BASE`) |
| Phase 1 SUCCESS log | Done — `success/SuccessLog.md` (2026-06-26) |

---

## Phase 2 — current status

| Item | Status |
|---|---|
| `dedupeNewsItems` by canonical URL | Done — `api/src/normalize/news-item.js` |
| Official source wins on duplicate | Done — `isOfficial` + `priority` in registry |
| Sort by `publishedAt` desc | Done — ingest + `getNews` |
| `GET /v1/sources` metadata | Done — `listSourcesForApi()` |
| Phase 2 SUCCESS log | Done — `success/SuccessLog.md` (2026-06-26) |

---

## Phase 3 — current status

| Item | Status |
|---|---|
| Forum announcements RSS | Done — `cursor-forum-announcements` in registry |
| Scrape ingest path | Done — `api/src/ingest/scrape.js` (env-gated) |
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

## Do not (any phase)

- Edit PasteCraft for this product
- Republish full articles or paywalled content
- Ship without disclaimer + attribution on every item
- Assume Netlify/production deploy unless user confirms
