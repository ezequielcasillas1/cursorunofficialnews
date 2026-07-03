# Deploy to Cloudflare Workers (Website + Full API — Fly.io Retired)

**Everything runs in one Cloudflare Worker**: the built Vite/React website, the full REST API (ingest, news feed, email digests, push notifications, Stripe membership, newsletter AI), D1 for storage, Workers AI for summarization, and a Cron Trigger for scheduled ingest. There is no separate API host anymore.

| Layer | Host | URL |
|---|---|---|
| Website + `/api/*` | Cloudflare Workers | `https://cursorunofficial.news` (or `www`) |
| Data | Cloudflare D1 (`cursorunofficialnews`) | bound as `env.DB` |
| AI summarization | Workers AI | bound as `env.AI` |
| Scheduled ingest | Cron Trigger | `*/30 * * * *` |

**Repo:** `github.com/ezequielcasillas1/cursorunofficialnews` (private; default branch `main`)

## Architecture

```
Browser → cursorunofficial.news (Cloudflare Worker)
            ├─ /api/*  → Hono app (web/worker/src/app.js) → D1 + Workers AI + external fetch APIs
            ├─ scheduled() → same ingest pipeline, every 30 min
            └─ /*      → web/dist static assets (SPA)
```

| Component | Runs on |
|---|---|
| Web UI | Workers static assets (`web/dist`) |
| API routes | Hono app, `web/worker/src/` — mounted at `/api` |
| Storage | D1 (`news_items`, `known_items`, `device_tokens`, `email_subscribers`, `memberships`, `membership_claim_requests`, `ingest_state`; `bmc_members` retired) |
| AI summarization | Workers AI (`@cf/meta/llama-3.1-8b-instruct` by default) |
| Newsletter HTML | Cursor Composer API (`api.cursor.com`) — unchanged, already `fetch`-based |

---

## Repo artifacts

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker name, `main`, D1/AI bindings, cron trigger, static assets path |
| `web/worker/index.js` | Entry — routes `/api/*` to the Hono app, else serves static assets; `scheduled()` runs ingest |
| `web/worker/src/app.js` | Hono app assembly (CORS, security headers, route registration) |
| `web/worker/src/db/schema.sql` | D1 schema — apply via `wrangler d1 execute` |
| `web/worker/src/store/*` | D1-backed data access (replaces the old fs/JSON stores) |
| `web/worker/src/ingest/*` | RSS/Atom, scrape, sitemap, Twitter ingest (fetch-based, unchanged from the old server) |
| `web/public/_headers` | Minimal security headers on static assets |
| `web/.node-version` | Node 20 for Cloudflare build (Vite 7 requires Node 20+) |

Vite outputs to **`web/dist/`**. Wrangler reads `assets.directory` from `wrangler.jsonc`.

Root `package.json` scripts:

| Script | Command |
|---|---|
| `npm run build` | Installs `web/` deps and runs `vite build` → `web/dist/` |
| `npm run deploy:web` | Build + `wrangler deploy` |
| `npm run preview:web` | Build + `wrangler dev` (local Workers preview) |
| `npm run dev:api` | `wrangler dev` — local API + D1 (SQLite emulation) + real Workers AI |

---

## One-time setup for a fresh clone

### 1. Create the D1 database

```powershell
npx wrangler d1 create cursorunofficialnews
```

Copy the returned `database_id` into `wrangler.jsonc` → `d1_databases[0].database_id`.

### 2. Apply the schema

```powershell
npx wrangler d1 execute cursorunofficialnews --remote --file=web/worker/src/db/schema.sql
```

(Drop `--remote` to also seed local dev's SQLite emulation.)

### 3. Set secrets

Never commit these — set via `wrangler secret put`:

```powershell
# Required for production
npx wrangler secret put INGEST_SECRET

# Website features (set what you use)
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CURSOR_API_KEY
npx wrangler secret put N8N_NEWSLETTER_WEBHOOK_URL
npx wrangler secret put N8N_NEWSLETTER_WEBHOOK_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PRICE_ID_1
npx wrangler secret put STRIPE_PRICE_ID_2
npx wrangler secret put STRIPE_PRICE_ID_3
npx wrangler secret put STRIPE_PRICE_ID_4
npx wrangler secret put STRIPE_PRICE_ID_5

# Ingest sources (optional)
npx wrangler secret put TWITTER_BEARER_TOKEN
npx wrangler secret put SCRAPE_API_URL
npx wrangler secret put SCRAPE_API_KEY

# Mobile push only — skip for website-only deploy
npx wrangler secret put REGISTER_SECRET
```

Only **`INGEST_SECRET`** is required in production. Other secrets are optional — their features skip gracefully when unset (see `web/worker/src/*` `isXConfigured()` checks).

| Secret | Website needs it? | When unset |
|---|---|---|
| `INGEST_SECRET` | **Yes** | `POST /api/v1/ingest` returns 503 |
| `RESEND_API_KEY` | For email digests | Email subscribe/verify returns 503 |
| `STRIPE_*` | For membership checkout | Checkout errors; webhook 503 |
| `CURSOR_API_KEY` | For newsletter AI | Newsletter build skips AI |
| `N8N_NEWSLETTER_*` | For n8n webhook path | Webhook trigger skipped |
| `REGISTER_SECRET` | **No** (mobile push only) | `POST /api/v1/devices/register` returns 503; all other website flows work |

**Push registration (mobile only):** If you later enable mobile push, set `REGISTER_SECRET` on the Worker and mirror it in mobile as `EXPO_PUBLIC_REGISTER_SECRET`.

`N8N_NEWSLETTER_WEBHOOK_URL` is a single secret — use your n8n **live** `/webhook/...` URL in production. Locally, set the same var name in `env/server/.env` with your n8n **test** `/webhook-test/...` URL. There is no separate TARGET or `_TEST`/`_PROD` env var.

Workflow export, credentials, and audit-fix import steps: [docs/n8n/README.md](n8n/README.md).

Non-secret config lives in `wrangler.jsonc` → `vars` (`ENVIRONMENT`, `PUBLIC_API_BASE`, `PUBLIC_WEB_BASE`, `RESEND_FROM_EMAIL`, `EMAIL_NOTIFICATIONS`, `PUSH_NOTIFICATIONS`, `N8N_NEWSLETTER_MODE`).

Optional production secret for owner newsletter access without paid membership:

```powershell
npx wrangler secret put NEWSLETTER_FREE_EMAILS
# e.g. you@example.com (comma-separated)
```

### 4. Deploy

```powershell
cd C:\Dev\CursorAINews
npx wrangler login   # one-time, opens browser
npm run deploy:web
```

Wrangler bundles `web/worker/index.js` (esbuild resolves all imports across `web/worker/src/`), builds the D1/AI/assets/cron bindings from `wrangler.jsonc`, and deploys.

### 5. Custom domain

**Workers & Pages** → **`cursorunofficialnews`** → **Settings → Domains & Routes** → **Add Custom Domain** → `cursorunofficial.news` (+ optional `www`). SSL is automatic. Do **not** duplicate domains in `wrangler.jsonc` — CI deploy fails on `domains/records` API conflicts.

---

## Website-only deploy checklist

Use this when deploying **only** the website + Worker API (no mobile app).

### Secrets to set (minimum)

```powershell
npx wrangler secret put INGEST_SECRET
```

### Secrets by feature (set what you use)

| Feature | Secrets |
|---|---|
| Email digests + verification | `RESEND_API_KEY` |
| Stripe membership | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_1` … `_5` |
| Newsletter AI | `CURSOR_API_KEY` |
| n8n newsletter webhook | `N8N_NEWSLETTER_WEBHOOK_URL`, `N8N_NEWSLETTER_WEBHOOK_SECRET` |
| Owner newsletter bypass | `NEWSLETTER_FREE_EMAILS` (optional) |

**Skip for website-only:** `REGISTER_SECRET` (mobile push registration only).

### Deploy

```powershell
cd C:\Dev\CursorAINews
npm run deploy:web
```

Or push to `main` — CI auto-deploys via Workers Builds.

### Post-deploy smoke tests

```powershell
curl https://cursorunofficial.news/api/health
curl "https://cursorunofficial.news/api/v1/news?limit=5"
curl "https://cursorunofficial.news/api/v1/status"
```

Verify membership checkout redirect, email subscribe (if `RESEND_API_KEY` set), and Stripe webhook in dashboard.

### Security headers (built-in)

| Layer | Headers |
|---|---|
| Static assets (`web/public/_headers`) | `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` |
| API responses (`web/worker/src/app.js`) | Same + `Strict-Transport-Security` in production |
| Worker rate limits (in-isolate) | Email subscribe/verify, membership checkout/claim, device register |

### Cloudflare Rate Limiting rules (dashboard — optional belt-and-suspenders)

Worker middleware already rate-limits sensitive endpoints per-IP. Add **Cloudflare Rate Limiting** rules in the dashboard for edge-level protection on abuse-prone API paths:

**Dashboard:** Security → WAF → Rate limiting rules → Create rule

| Rule name | Expression | Characteristics | Action | Period |
|---|---|---|---|---|
| Email subscribe | `(http.request.uri.path eq "/api/v1/email/subscribe" and http.request.method eq "POST")` | IP | Block | 60s, threshold 10 |
| Membership checkout | `(http.request.uri.path eq "/api/v1/membership/checkout" and http.request.method eq "POST")` | IP | Block | 60s, threshold 10 |
| Membership claim | `(http.request.uri.path eq "/api/v1/membership/claim" and http.request.method eq "POST")` | IP | Block | 60s, threshold 10 |
| Email unsubscribe | `(http.request.uri.path eq "/api/v1/email/unsubscribe" and http.request.method eq "POST")` | IP | Block | 60s, threshold 20 |

Do **not** rate-limit `GET /api/v1/news` (public feed) or `POST /api/v1/stripe/webhook` (Stripe retries need through).

### npm audit (web only)

```powershell
cd web
npm audit
```

Last run: 0 vulnerabilities.

---

## CI/CD — Cloudflare Workers Builds (Git auto-deploy)

Pushing to `main` on GitHub (`ezequielcasillas1/cursorunofficialnews`) **automatically builds and deploys** — no manual step required.

| Item | Value |
|---|---|
| Provider connection | GitHub App, repo `cursorunofficialnews` (already authorized) |
| Trigger — production | `main` branch → `npm run build` → `npx wrangler deploy` |
| Trigger — other branches | `*` (excl. `main`) → `npm run build` → `npx wrangler versions upload` (preview build only) |
| Root directory | `/` (repo root) |
| Node version | Picked up from `web/.node-version` (20) |

**Check build status:** Dashboard → **Workers & Pages** → `cursorunofficialnews` → **Deployments**. Or via API (script tag `9e868a201fff40b496fc8770ec4db012`):

```
GET /accounts/{account_id}/builds/workers/{script_tag}/triggers   # trigger config
GET /accounts/{account_id}/builds/workers/{script_tag}/builds     # build history
GET /accounts/{account_id}/builds/builds/{build_uuid}/logs        # logs for one build
```

`npm run deploy:web` (manual `wrangler deploy`) still works and is the fallback if a build fails or for out-of-band deploys.

**Disable/pause auto-deploy:** `DELETE /accounts/{account_id}/builds/triggers/{trigger_uuid}` (production trigger UUID `5bd5b75e-f61b-4047-96cb-6427966a51c8`), or toggle it off in the dashboard under the Worker's **Settings → Build**.

---

## Local development

```powershell
cd C:\Dev\CursorAINews

# Terminal 1 — API (local D1 emulation + real Workers AI; needs --use-system-ca behind corporate TLS/Zscaler)
$env:NODE_OPTIONS="--use-system-ca"
npm run dev:api

# Terminal 2 — Web (Vite, HMR, proxies /api → :8787)
npm run dev:web
```

First time only, seed local D1:

```powershell
npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/schema.sql
```

Trigger the scheduled ingest manually in local dev:

```powershell
curl "http://127.0.0.1:8787/cdn-cgi/handler/scheduled"
```

Validate config without deploying:

```powershell
npx wrangler deploy --dry-run --outdir=.wrangler-dryrun
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `assets.directory` / `dist` not found | Output dir `dist` at repo root; Vite uses `web/dist` | `wrangler.jsonc` → `./web/dist` |
| `Missing script: "build"` | Wrong root directory in dashboard | Leave **Root directory** blank; **Build command** → `npm run build` |
| Build fails on Node | Default Node 18 | Set `NODE_VERSION=20` or rely on `web/.node-version` |
| `/api/v1/news` returns empty `items` | Cold D1 — no ingest has run yet | Hit any `/api/*` route (triggers a background bootstrap ingest) or wait for the next Cron Trigger (≤30 min) |
| `POST /api/v1/ingest` 401 | Missing/incorrect `X-API-Secret` | Must match the `INGEST_SECRET` Worker secret |
| Push register 401 / 503 | Missing `REGISTER_SECRET` or mobile secret mismatch | Set Worker secret + `EXPO_PUBLIC_REGISTER_SECRET` on EAS rebuild ([SECURITY-HARDENING.md](SECURITY-HARDENING.md)) |
| Ingest hangs locally in `wrangler dev` | `workerd`'s own TLS stack under corporate proxy/Zscaler interception — not a code bug | Verified fine in production (Cloudflare's real network); if it blocks local testing, test the ingest functions directly with plain `node --use-system-ca` instead |
| `Some triggers failed to deploy` / `domains/records` | Custom domains duplicated in `wrangler.jsonc` | Remove `routes`/domains from `wrangler.jsonc`; manage domains in dashboard only |
| 404 on refresh / deep link | Missing SPA fallback | `not_found_handling: "single-page-application"` in `wrangler.jsonc` |
| Workers AI errors in local dev | AI binding always proxies to Cloudflare, needs auth | `npx wrangler login` first, or accept remote-mode usage charges are minimal for `/api/v1/llm/status` (no inference call) |

---

## Related docs

- [SECURITY-HARDENING.md](SECURITY-HARDENING.md) — rate limiting rules, REGISTER_SECRET + mobile EAS
- [RUN-LOCAL.md](RUN-LOCAL.md) — local dev (Vite proxy to `wrangler dev`)
- [AGENT-CONTEXT.md](AGENT-CONTEXT.md) — agent cold start
- [STRIPE-GO-LIVE.md](STRIPE-GO-LIVE.md) — Stripe membership go-live checklist
