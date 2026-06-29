# Deploy Web to Cloudflare Workers (Static Assets + API Proxy)

Host the **Vite + React web preview** (`web/`) on Cloudflare Workers with static assets. The **API runs on Fly.io** (always-on cloud, cron ingest, JSON persistence) — the Worker **proxies `/api/*`** to Fly so the site works without your local machine.

| Layer | Host | URL |
|---|---|---|
| Web (static + `/api` proxy) | Cloudflare Workers | `https://cursorunofficial.news` (or `www`) |
| API (Express, ingest, cron) | Fly.io | `https://cursorunofficialnews.fly.dev` |

**Why the JSON error happens:** If `/api/v1/news` is not proxied, Cloudflare serves `index.html` (SPA fallback). The browser tries to parse HTML as JSON → `Unexpected token '<', "<!doctype "...`. Fix: deploy the Worker with `web/worker/index.js` (proxies `/api`) **and** ensure Fly.io API is healthy.

**Repo:** `github.com/ezequielcasillas1/cursorunofficialnews` (private; default branch `main`)

Confirm locally:

```powershell
git remote -v
# origin  https://github.com/ezequielcasillas1/cursorunofficialnews.git (fetch)
```

## Architecture

```
Browser → cursorunofficial.news (Cloudflare Worker)
            ├─ /api/*  → proxy → cursorunofficialnews.fly.dev (Fly.io Express API)
            └─ /*      → web/dist static assets (SPA)
```

| Component | Runs on | Why not Cloudflare Workers alone? |
|---|---|---|
| Web UI | Workers static assets | Vite build output; SPA fallback |
| `/api` proxy | Worker script (`web/worker/index.js`) | Same-origin `/api` — no CORS, no build-time env required |
| Feed API + ingest | Fly.io (`mobile/server/`) | Express, `node-cron`, `fs` JSON store, RSS fetch — Node-only |

Scheduled ingest: Fly.io in-process cron (`INGEST_CRON_ENABLED=true`) or external cron hitting `POST /v1/ingest`. See [FLY-DEPLOY.md](FLY-DEPLOY.md).

---

## Prerequisites (do these first)

1. **Fly API is deployed and healthy** — see [FLY-DEPLOY.md](FLY-DEPLOY.md).

   ```powershell
   Invoke-RestMethod https://cursorunofficialnews.fly.dev/health
   Invoke-RestMethod https://cursorunofficialnews.fly.dev/v1/news?limit=3
   ```

2. **Domain nameservers point to Cloudflare** — you already connected NS for `cursorunofficial.news`. Wait until Cloudflare shows the zone as **Active** (can take up to 24h; often minutes).

3. **Push this repo to GitHub** — Cloudflare Workers connects to the GitHub repo for automatic builds on push.

4. **Resend domain verification (separate)** — Email digests use Resend + Fly secrets, not Cloudflare. If you plan to send from `@cursorunofficial.news`, verify the domain in the [Resend dashboard](https://resend.com/domains) and add the DNS records Resend provides (can live alongside Workers DNS in Cloudflare). This does **not** block the web deploy.

---

## Repo artifacts

| File | Purpose |
|---|---|
| `wrangler.jsonc` | Worker name, `main` script, `API_ORIGIN` var, static assets path |
| `web/worker/index.js` | Proxies `/api/*` → Fly.io; serves static assets otherwise |
| `web/public/_headers` | Minimal security headers on static assets |
| `web/.node-version` | Node 20 for Cloudflare build (Vite 7 requires Node 20+) |
| `web/.env.example` | Documents `VITE_API_BASE` (optional; default `/api` uses proxy) |

Vite outputs to **`web/dist/`**, not repo-root `dist/`. Wrangler reads `assets.directory` from `wrangler.jsonc`.

Root `package.json` scripts:

| Script | Command |
|---|---|
| `npm run build` | Installs `web/` deps and runs `vite build` → `web/dist/` |
| `npm run deploy:web` | Build + `wrangler deploy` |
| `npm run preview:web` | Build + `wrangler dev` (local Workers preview) |

---

## Wrangler config (committed at repo root)

```jsonc
{
  "name": "cursorunofficialnews",
  "main": "./web/worker/index.js",
  "compatibility_date": "2025-06-27",
  "vars": {
    "API_ORIGIN": "https://cursorunofficialnews.fly.dev"
  },
  "assets": {
    "directory": "./web/dist",
    "binding": "ASSETS",
    "not_found_handling": "single-page-application"
  }
}
```

**Do not** set `"directory": "dist"` — Vite builds to `web/dist/`.

To point at a different API host, change `vars.API_ORIGIN` or set it in the Cloudflare dashboard under **Settings → Variables**.

---

## Cloudflare Workers — dashboard setup

### 1. Create / verify the Worker project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** → **Create** → **Workers** → **Connect to Git** (or open existing project **`cursorunofficialnews`**).
3. Authorize GitHub if prompted; select repo **`ezequielcasillas1/cursorunofficialnews`**.

### 2. Build & deploy settings

Under **Settings → Builds & deployments** (Workers Git integration):

| Setting | Value | Notes |
|---|---|---|
| **Production branch** | `main` | Or your default branch |
| **Framework preset** | Static site / None | Auto-detect may guess wrong output dir |
| **Root directory** | *(repo root — leave blank)* | Build runs from repo root |
| **Build command** | `npm run build` | Delegates to `web/` via root `package.json` |
| **Deploy command** | `npx wrangler deploy` | Uses `wrangler.jsonc` at repo root |
| **Build output directory** | `web/dist` | **Not** `dist` — Vite writes under `web/` |

If the dashboard only shows **Output directory** (no separate deploy command), set it to **`web/dist`**. Wrangler still resolves assets from `wrangler.jsonc` → `./web/dist` at deploy time.

### 3. Environment variables (build-time)

**`VITE_API_BASE` is optional.** Default `/api` is proxied by the Worker to Fly.io.

Only set build env vars if you need an override:

| Variable | Value | Required? |
|---|---|---|
| `VITE_API_BASE` | `/api` (default) or `https://cursorunofficialnews.fly.dev` | No — omit for Worker proxy |
| `VITE_ADSENSE_CLIENT_ID` | `ca-pub-5184491334740169` | Optional — enables in-app ad slots; site verification uses static script in `web/index.html` |
| `VITE_BMC_USERNAME` | Your BMC page slug | Optional — enables membership CTA + ad-free claim UI; see [BMC-GO-LIVE.md](BMC-GO-LIVE.md) |
| `NODE_VERSION` | `20` | Only if build fails on Node 18 |

Worker runtime var (not Vite):

| Variable | Value | Where |
|---|---|---|
| `API_ORIGIN` | `https://cursorunofficialnews.fly.dev` | `wrangler.jsonc` `vars` or dashboard **Variables** |

Do **not** set `VITE_INGEST_SECRET` in Cloudflare unless you intentionally expose ingest from the public web UI (not recommended for production).

### 4. Deploy

- Save settings → Cloudflare runs build then `wrangler deploy`.
- Watch **Deployments** for logs; a successful deploy gets a `*.workers.dev` URL.

### 5. Custom domain

1. **Workers & Pages** → **`cursorunofficialnews`** → **Settings → Domains & Routes** → **Add Custom Domain**.
2. Add **`cursorunofficial.news`** (apex).
3. Cloudflare creates the DNS records automatically because the zone is on Cloudflare.
4. Optional: add **`www.cursorunofficial.news`** and set a redirect (apex → www or www → apex) under **Rules → Redirect Rules** if you want a single canonical host.

SSL/TLS is automatic (Cloudflare Universal SSL).

### 6. Verify the live site

1. Open `https://cursorunofficial.news` (or your `*.workers.dev` URL before DNS is wired).
2. Confirm the news feed loads (not “Unexpected token '<'” or “Request timed out”).
3. DevTools → **Network** → confirm requests go to **`/api/v1/news`** (same origin) or your `VITE_API_BASE` override.
4. Optional smoke test from PowerShell:

   ```powershell
   Invoke-RestMethod "https://cursorunofficialnews.fly.dev/v1/news?limit=1"
   ```

---

## Local production-like preview

From repo root (Workers preview):

```powershell
cd C:\Dev\CursorAINews
$env:VITE_API_BASE="https://cursorunofficialnews.fly.dev"
npm run preview:web
```

Or Vite-only preview from `web/`:

```powershell
cd C:\Dev\CursorAINews\web
$env:VITE_API_BASE="https://cursorunofficialnews.fly.dev"
npm run build
npm run preview
```

Validate config without uploading:

```powershell
cd C:\Dev\CursorAINews
npm run build
npx wrangler deploy --dry-run
```

---

## Troubleshooting

### `Unexpected token '<', "<!doctype "... is not valid JSON`

**Root cause:** The browser requested JSON from `/api/v1/news`, but got HTML (`index.html`) because:

1. Worker proxy is missing (old deploy without `web/worker/index.js`), **or**
2. Fly.io API is down / cold-starting (`min_machines_running = 0`), **or**
3. Wrong path — request hit static assets instead of `/api`.

**Fix:**

1. Redeploy with current `wrangler.jsonc` (includes `main: ./web/worker/index.js`).
2. Verify Fly: `Invoke-RestMethod https://cursorunofficialnews.fly.dev/health`
3. Test proxy on live site: open `https://cursorunofficial.news/api/v1/news?limit=1` — should return JSON, not HTML.

### `assets.directory` does not exist (`/opt/buildhome/repo/dist`)

**Root cause:** Wrangler (or dashboard auto-setup) pointed at repo-root `dist/`, but Vite builds to `web/dist/`.

**Fix:**

1. Commit `wrangler.jsonc` with `"directory": "./web/dist"`.
2. In Cloudflare dashboard, set **Build output directory** → **`web/dist`** (not `dist`).
3. Redeploy.

### `PROJECT CANNOT BE FOUND` (most common first)

1. **GitHub app cannot see the repo (private repo)** — This repo is **private**. During Cloudflare → **Connect to Git**, the GitHub **Cloudflare Workers & Pages** app must include `ezequielcasillas1/cursorunofficialnews` under **Repository access**.
   - GitHub → **Settings** → **Integrations** → **Applications** → **Cloudflare Workers and Pages** → **Configure**
   - Set **Repository access** → **Only select repositories** → add **`cursorunofficialnews`**
   - Or use **All repositories** temporarily, then retry **Workers & Pages** → **Create** → **Connect to Git**

2. **Worker project not created yet** — Create it: **Workers & Pages** → **Create** → **Workers** → **Connect to Git** → pick **`ezequielcasillas1/cursorunofficialnews`**.

3. **Wrong Cloudflare account** — Domain zone `cursorunofficial.news` and the Worker must live under the **same** Cloudflare account.

4. **Repo already linked on another Cloudflare account** — One GitHub repo can only back one Workers/Pages project per account in some setups. Delete the old project on the other account, or use **Direct Upload** / a different repo.

5. **Stale GitHub authorization** — Uninstall **Cloudflare Workers and Pages** from GitHub (Applications page), then reconnect from the Cloudflare **Connect to Git** flow.

6. **Fly.io API not deployed** — Does **not** cause "PROJECT CANNOT BE FOUND", but the site will fail after deploy. `https://cursorunofficialnews.fly.dev/health` must respond before you rely on the live feed. See [FLY-DEPLOY.md](FLY-DEPLOY.md).

| Symptom | Likely cause | Fix |
|---|---|---|
| `assets.directory` / `dist` not found | Output dir `dist` at repo root; Vite uses `web/dist` | Set `wrangler.jsonc` → `./web/dist`; dashboard **Build output directory** → `web/dist` |
| `Missing script: "build"` | Wrong root directory in dashboard | Leave **Root directory** blank (repo root); **Build command** → `npm run build` |
| Build fails on Node | Default Node 18 | Set `NODE_VERSION=20` or rely on `web/.node-version` |
| Feed timeout / empty | API down or cold start on Fly | Check Fly health; first request may wake machine (~5–10s) |
| JSON parse / `<!doctype` error | `/api` not proxied; HTML SPA fallback | Deploy Worker with `web/worker/index.js`; test `/api/v1/news` |
| Wrong `VITE_API_BASE` | Direct Fly URL misconfigured | Omit `VITE_API_BASE` to use `/api` proxy, or set correct Fly URL |
| 404 on refresh / deep link | Missing SPA fallback | `not_found_handling: "single-page-application"` in `wrangler.jsonc` |
| `_redirects` infinite loop (100324) | `/* /index.html 200` conflicts with wrangler SPA handling | Remove `web/public/_redirects`; rely on `not_found_handling` only |
| CORS errors | Unlikely — API uses open CORS | Check browser console; confirm API URL is HTTPS |
| Domain not resolving | NS propagation or wrong zone | Cloudflare zone **Active**; check **DNS** records for Worker custom domain |
| Email not sending | Resend, not Cloudflare | Verify domain in Resend; set Fly secrets per [FLY-DEPLOY.md](FLY-DEPLOY.md) |

---

## Alternative: Cloudflare Pages

You can also deploy via **Pages** with **Root directory** → `web`, **Build command** → `npm run build`, **Build output directory** → `dist` (relative to `web/`). The current repo setup targets **Workers Static Assets** + `wrangler.jsonc` at repo root.

---

## Deploy API first (Fly.io)

The web site depends on a cloud API. One-time setup:

```powershell
cd C:\Dev\CursorAINews
fly auth login
fly deploy
fly secrets set INGEST_SECRET="..." NODE_ENV="production" INGEST_CRON_ENABLED="true" PUBLIC_API_BASE="https://cursorunofficialnews.fly.dev"
```

Full details: [FLY-DEPLOY.md](FLY-DEPLOY.md).

---

## Related docs

- [FLY-DEPLOY.md](FLY-DEPLOY.md) — API on Fly.io (must be up first)
- [RUN-LOCAL.md](RUN-LOCAL.md) — local dev (Vite proxy to `:8787`)
- [AGENT-CONTEXT.md](AGENT-CONTEXT.md) — agent cold start
