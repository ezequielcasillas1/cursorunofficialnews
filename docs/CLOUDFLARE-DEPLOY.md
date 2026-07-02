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
npx wrangler secret put INGEST_SECRET
npx wrangler secret put REGISTER_SECRET
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
npx wrangler secret put TWITTER_BEARER_TOKEN
npx wrangler secret put SCRAPE_API_URL
npx wrangler secret put SCRAPE_API_KEY
```

Only `INGEST_SECRET` is required in production (guards `POST /api/v1/ingest`); the rest are optional and gracefully skip their feature when unset (see `web/worker/src/*` `isXConfigured()` checks).

`N8N_NEWSLETTER_WEBHOOK_URL` is a single secret — use your n8n **live** `/webhook/...` URL in production. Locally, set the same var name in `env/server/.env` with your n8n **test** `/webhook-test/...` URL. There is no separate TARGET or `_TEST`/`_PROD` env var.

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
| Ingest hangs locally in `wrangler dev` | `workerd`'s own TLS stack under corporate proxy/Zscaler interception — not a code bug | Verified fine in production (Cloudflare's real network); if it blocks local testing, test the ingest functions directly with plain `node --use-system-ca` instead |
| `Some triggers failed to deploy` / `domains/records` | Custom domains duplicated in `wrangler.jsonc` | Remove `routes`/domains from `wrangler.jsonc`; manage domains in dashboard only |
| 404 on refresh / deep link | Missing SPA fallback | `not_found_handling: "single-page-application"` in `wrangler.jsonc` |
| Workers AI errors in local dev | AI binding always proxies to Cloudflare, needs auth | `npx wrangler login` first, or accept remote-mode usage charges are minimal for `/api/v1/llm/status` (no inference call) |

---

## Related docs

- [RUN-LOCAL.md](RUN-LOCAL.md) — local dev (Vite proxy to `wrangler dev`)
- [AGENT-CONTEXT.md](AGENT-CONTEXT.md) — agent cold start
- [STRIPE-GO-LIVE.md](STRIPE-GO-LIVE.md) — Stripe membership go-live checklist
