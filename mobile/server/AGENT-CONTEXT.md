# Agent Context — API Server (inside `mobile/`)

Everything a new chat needs for the **Node API**. **This is Cursor AI News — NOT PasteCraft.**

| | |
|---|---|
| **Project root** | `C:\Dev\CursorAINews` |
| **App folder** | `C:\Dev\CursorAINews\mobile` (Expo client + this server) |
| **This server** | `C:\Dev\CursorAINews\mobile\server` |
| **Repo** | `github.com/ezequielcasillas1/cursorunofficialnews` |
| **Product** | Unofficial Cursor News — fan app, not affiliated with Anysphere |

Canonical onboarding copy also lives at `docs/AGENT-CONTEXT.md`.

---

## Stack

| Layer | Path | Port / notes |
|---|---|---|
| Expo client | `../` (mobile root) | Expo Dev Client — **primary client** |
| API server | `.` (this folder) | Express `:8787` — ingest, normalize, JSON |
| Web | `../../web/` | React + Vite — legacy preview |

---

## Run (Windows PowerShell)

```powershell
cd C:\Dev\CursorAINews\mobile\server; npm install; npm run dev

cd C:\Dev\CursorAINews\mobile; npm install; npx expo start --dev-client
```

From `mobile/` root: `npm run dev:server` starts this API.

API health: `http://127.0.0.1:8787/health`  
Ingest: `POST http://127.0.0.1:8787/v1/ingest`  
Feed: `GET http://127.0.0.1:8787/v1/news`

---

## Physical Android → local API

| Method | Command / config |
|---|---|
| USB reverse | `adb reverse tcp:8787 tcp:8787` |
| LAN IP | `EXPO_PUBLIC_API_BASE=http://192.168.x.x:8787` before Expo start (see `../.env.example`) |
| Emulator | Default `http://10.0.2.2:8787` in `../src/config/constants.js` |

Client: `../src/api/newsClient.js` · config: `../app.config.js`

---

## Zscaler / corporate TLS

Outbound RSS fetch needs system CA: `node --use-system-ca` (already in `package.json` `dev`/`start` scripts).

---

## Production (Fly.io) — newsletter email

Full deploy: `docs/FLY-DEPLOY.md`. Email vars are **Fly secrets** (not in `fly.toml` or git).

| Secret | Required for email | Notes |
|--------|-------------------|--------|
| `EMAIL_NOTIFICATIONS` | Yes | `true` — set `false` to disable |
| `RESEND_API_KEY` | Yes | From [Resend API keys](https://resend.com/api-keys); omit → digests skip gracefully |
| `RESEND_FROM_EMAIL` | Yes | Verified domain sender (not `onboarding@resend.dev` sandbox) |
| `PUBLIC_API_BASE` | Yes | e.g. `https://cursorunofficialnews.fly.dev` — unsubscribe links |
| `INGEST_CRON_ENABLED` | Recommended | `true` — digests fire after scheduled ingest when new items match topics |

```powershell
cd C:\Dev\CursorAINews
fly secrets set RESEND_API_KEY="re_..." RESEND_FROM_EMAIL="Unofficial Cursor News <news@yourdomain.com>"
```

If not set yet, include `EMAIL_NOTIFICATIONS="true"` in the main secrets block (see `docs/FLY-DEPLOY.md`). Verify sender domain in Resend before production sends. List secrets: `fly secrets list`.
