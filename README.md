# Unofficial Cursor News

**Standalone project:** `C:\Dev\CursorAINews` (moved out of PasteCraft).

**Not affiliated with Anysphere.** Fan project for Cursor changelog, releases, and community news.

Primary client: **Expo Dev Client** (`mobile/`). API server lives at `mobile/server/`. Legacy web client kept in `web/`.

**Phased build plan (Phases 1–7):** `.cursor/rules/unofficial-cursor-news-feed-service.mdc`

Open this folder in Cursor: **File → Open Folder →** `C:\Dev\CursorAINews`

## Stack

| Layer | Tech | Folder |
|---|---|---|
| Mobile (primary) | Expo + React Native + expo-dev-client | `mobile/` |
| API | Node.js + Express | `mobile/server/` |
| Web (legacy) | React 19 + Vite | `web/` |

## Quick start (Windows 11)

**Terminal 1 – API**

```powershell
cd C:\Dev\CursorAINews\mobile\server; npm install; npm run dev
```

**Terminal 2 – Expo dev client**

```powershell
cd C:\Dev\CursorAINews\mobile; npm install; npx expo install expo-dev-client expo-constants; npx expo start --dev-client
```

Or from repo root (after installs above):

```powershell
npm run dev:api
npm run dev:mobile
```

**First Android dev build** (once per machine / after native dep changes):

```powershell
cd C:\Dev\CursorAINews\mobile; npx expo run:android
```

Physical device: set `EXPO_PUBLIC_API_BASE=http://<your-pc-lan-ip>:8787` before starting Expo.

## Phase 1 scope

- Official feeds only: changelog RSS + GitHub releases
- `GET /v1/news` feed list; tap opens original URL
- Refresh runs `POST /v1/ingest`
- Unofficial disclaimer in app

## Docs

- [mobile/README.md](mobile/README.md) – architecture + API URL matrix
- [SOURCE-STRATEGY.md](docs/SOURCE-STRATEGY.md) – four ingest paths + ethics
- [WEEK-PLAN.md](docs/WEEK-PLAN.md) – one-week build order

## Monetization (planned)

Free core feed. Optional membership $0.99–$4.99/mo (Stripe/web later; not in Phase 1).