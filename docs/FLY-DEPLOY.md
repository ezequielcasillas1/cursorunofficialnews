# Deploy API to Fly.io

Deploy the **API only** (`mobile/server/`) — not the Expo mobile app.

**GitHub integration:** Fly launch from `ezequielcasillas1/cursorunofficialnews` uses **root `fly.toml`** (app `cursorunofficialnews`). No extra config path needed if the repo root contains `fly.toml`.

**Manual deploy from repo root:**

```powershell
cd C:\Dev\CursorAINews
fly deploy
```

**Manual deploy using `mobile/server/fly.toml`:**

```powershell
cd C:\Dev\CursorAINews
fly deploy --config mobile/server/fly.toml --build-context .
```

The Docker build needs **repo root** as context (`mobile/shared` is imported by the server).

---

## One-time Fly setup

1. Install [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and `fly auth login`.
2. Create the app (if not created via GitHub launch):

   ```powershell
   fly apps create cursorunofficialnews
   ```

3. Create a persistent volume for JSON state (device tokens, subscribers, news cache):

   ```powershell
   fly volumes create cursorunofficialnews_data --region iad --size 1
   ```

   Region should match `primary_region` in `fly.toml` (`iad` by default). List regions: `fly platform regions`.

---

## Secrets (never commit these)

Set after launch, before or after first deploy:

```powershell
cd C:\Dev\CursorAINews

fly secrets set INGEST_SECRET="your-long-random-secret" `
  PUBLIC_API_BASE="https://cursorunofficialnews.fly.dev" `
  NODE_ENV="production" `
  INGEST_CRON_ENABLED="true" `
  EMAIL_NOTIFICATIONS="true" `
  PUSH_NOTIFICATIONS="true"
```

Optional (email digests via Resend):

```powershell
fly secrets set RESEND_API_KEY="re_..." RESEND_FROM_EMAIL="Unofficial Cursor News <news@yourdomain.com>"
```

Optional (lock device registration):

```powershell
fly secrets set REGISTER_SECRET="another-random-secret"
```

Optional (scrape fallback):

```powershell
fly secrets set SCRAPE_API_KEY="..." SCRAPE_API_URL="https://api.firecrawl.dev/v1/scrape"
```

Generate `INGEST_SECRET` locally:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Secret | Required | Notes |
|--------|----------|--------|
| `INGEST_SECRET` | Yes (production) | `X-API-Secret` on `POST /v1/ingest` |
| `PUBLIC_API_BASE` | Yes | Public HTTPS URL, e.g. `https://cursorunofficialnews.fly.dev` (email unsubscribe links) |
| `NODE_ENV` | Yes | `production` |
| `INGEST_CRON_ENABLED` | Recommended | `true` — in-process ingest every 30 min |
| `EMAIL_NOTIFICATIONS` | Optional | `true` / `false` |
| `PUSH_NOTIFICATIONS` | Optional | `true` / `false` |
| `RESEND_API_KEY` | If email enabled | Omit to skip sends gracefully |
| `RESEND_FROM_EMAIL` | If email enabled | Verified domain in Resend |
| `REGISTER_SECRET` | Optional | Protects `POST /v1/devices/register` |
| `INGEST_CRON_SCHEDULE` | Optional | Default `*/30 * * * *` |

`PORT`, `DATA_DIR`, and base `NODE_ENV` are set in `fly.toml` `[env]` — do not need secrets.

List secrets: `fly secrets list`

---

## Deploy

From repo root (GitHub does this automatically on push when configured):

```powershell
cd C:\Dev\CursorAINews
fly deploy
```

Or from `mobile/server` config with root build context:

```powershell
fly deploy --config mobile/server/fly.toml --build-context .
```

---

## Smoke test

```powershell
Invoke-RestMethod https://cursorunofficialnews.fly.dev/health
Invoke-RestMethod https://cursorunofficialnews.fly.dev/v1/status
```

Trigger ingest (replace secret):

```powershell
Invoke-RestMethod -Method POST https://cursorunofficialnews.fly.dev/v1/ingest `
  -Headers @{ 'X-API-Secret' = 'YOUR_INGEST_SECRET' }
```

---

## Data persistence

JSON files live on a Fly volume mounted at `/app/data` (`DATA_DIR`):

- `device-tokens.json`
- `email-subscribers.json`
- `known-items.json`
- `news-cache.json`

Backed by volume `cursorunofficialnews_data`. For multi-region or managed DB later, consider Neon Postgres and migrate off file storage.

---

## Mobile app production API URL

Set in EAS / `mobile/.env` for production builds:

```
EXPO_PUBLIC_API_BASE=https://cursorunofficialnews.fly.dev
```

Local dev: see `docs/RUN-LOCAL.md`.
