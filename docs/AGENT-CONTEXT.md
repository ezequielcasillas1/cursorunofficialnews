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
| `extension/`, merchant, clips, Supabase sync | `mobile/`, `web/worker/`, `web/` |
| PasteCraft `request.md` / `refresh.md` | `docs/CURSOR-AI-NEWS-PHASE-PLAN.md` |

---

## Stack

| Layer | Path | Notes |
|---|---|---|
| App (Expo client) | `mobile/` | Expo Dev Client — **primary client** |
| API + website | `web/worker/` + `web/` | **One Cloudflare Worker** (Hono API + D1 + Workers AI + Cron Trigger) serves the built React/Vite site and the full `/api/v1/*` API. Fly.io is retired — see [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) |

Modularity: `web/worker/src/sources/registry.js` → `ingest/` → `normalize/` → `store/` (D1) → `routes/` + feature route modules → client. Vertical slices per concern.

---

## Run (Windows PowerShell)

```powershell
cd C:\Dev\CursorAINews; npm run install:all

# Terminal 1 — API (wrangler dev, local D1 + real Workers AI)
npm run dev:api      # wrangler dev, :8787

# Terminal 2 — Web (Vite, proxies /api → :8787)
npm run dev:web      # :5173

# Terminal 3 — Mobile
npm run dev:mobile   # Expo dev client
```

First Android native build (once): `npx expo run:android` from `mobile/`.

API health: `http://127.0.0.1:8787/health`
Ingest: `POST http://127.0.0.1:8787/api/v1/ingest`
Feed: `GET http://127.0.0.1:8787/api/v1/news`

---

## Physical Android → local API

| Method | Command / config |
|---|---|
| USB reverse | `adb reverse tcp:8787 tcp:8787` |
| LAN IP | `EXPO_PUBLIC_API_BASE=http://192.168.x.x:8787` before Expo start (see `env/mobile.example.env`) |
| Emulator | Default `http://10.0.2.2:8787` in `mobile/src/config/constants.js` |

Client: `mobile/src/api/newsClient.js` · config: `mobile/app.config.js`

Note: mobile calls `${API_BASE}/v1/...` directly (no `/api` prefix locally) — local `wrangler dev` also answers unprefixed `/v1/*`? No — mobile's local dev target is the same Worker, so it must call `/api/v1/...` too. Production mobile builds use `EXPO_PUBLIC_API_BASE=https://cursorunofficial.news/api`.

---

## Zscaler / corporate TLS

Outbound fetch needs system CA in local dev: run `wrangler dev` with `$env:NODE_OPTIONS="--use-system-ca"` (workerd's own TLS stack, separate from Node's). Production Workers run on Cloudflare's network and are unaffected.

---

## Phase plan & rules

1. **[CURSOR-AI-NEWS-PHASE-PLAN.md](CURSOR-AI-NEWS-PHASE-PLAN.md)** — scope, verify steps, status checkboxes
2. **`.cursor/rules/unofficial-cursor-news-feed-service.mdc`** — phases 1–7 detail
3. **`.cursor/rules/cursor-ai-news-project-root.mdc`** — workspace routing (alwaysApply)

One phase at a time. Do not skip ahead unless user approves.

---

## Known dev blockers (may vary by machine)

- `JAVA_HOME` / Android SDK for `expo run:android`
- USB debugging / adb not in PATH
- Expo prebuild `fetch failed` (network/SSL)
- `wrangler dev` local D1 is a separate SQLite file from production D1 — apply schema locally too: `npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/schema.sql`

---

## Production deploy

| Layer | Host | Doc |
|---|---|---|
| Website + API + data + cron + AI | Cloudflare Worker `cursorunofficialnews` (`cursorunofficial.news`) | [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) |
| Email (Resend) | Worker secret `RESEND_API_KEY` + Resend domain verify | [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) |
| Stripe membership (ad-free + newsletter unlock) | Worker secrets `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_1..5` | [STRIPE-GO-LIVE.md](STRIPE-GO-LIVE.md) |
| Pipedream MCP (dev tooling) | `env/api.local.env` + `.cursor/mcp.json` | [PIPEDREAM-MCP.md](PIPEDREAM-MCP.md) |
| AI summarization | Workers AI binding (`env.AI`) — replaced local LM Studio in production | — |

Fly.io is fully retired — there is no separate API host anymore. Deploy with `npm run deploy:web` (builds the site, then `wrangler deploy`). Secrets are set via `wrangler secret put <NAME>`, never committed.

---

## Do not (any phase)

- Edit PasteCraft for this product
- Republish full articles or paywalled content
- Ship without disclaimer + attribution on every item
- Assume production deploy is live unless user confirms dashboard steps are done
- Reintroduce Fly.io, `node:fs`, or `node-cron` — the API is Workers-only now (D1 + Cron Triggers)
