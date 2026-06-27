# Deploy Web to Cloudflare Workers (Static Assets)

Host the **Vite + React web preview** (`web/`) on Cloudflare Workers with static assets. The API stays on Fly.io — the web app calls it at build time via `VITE_API_BASE`.

| Layer | Host | URL |
|---|---|---|
| Web (static) | Cloudflare Workers | `https://cursorunofficial.news` (or `www`) |
| API | Fly.io | `https://cursorunofficialnews.fly.dev` |

**Repo:** `github.com/ezequielcasillas1/cursorunofficialnews` (private; default branch `main`)

Confirm locally:

```powershell
git remote -v
# origin  https://github.com/ezequielcasillas1/cursorunofficialnews.git (fetch)
```

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
| `wrangler.jsonc` | Worker name + static assets path (`web/dist`) + SPA fallback |
| `web/public/_headers` | Minimal security headers on static assets |
| `web/.node-version` | Node 20 for Cloudflare build (Vite 7 requires Node 20+) |
| `web/.env.example` | Documents `VITE_API_BASE` for local vs production |

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
  "compatibility_date": "2025-06-27",
  "assets": {
    "directory": "./web/dist",
    "not_found_handling": "single-page-application"
  }
}
```

**Do not** set `"directory": "dist"` — that path does not exist after `npm run build`.

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

Under **Settings → Environment variables**, add for **Production** (and **Preview** if preview deploys should hit prod API):

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_BASE` | `https://cursorunofficialnews.fly.dev` | **Required** — baked into the JS bundle at build time |
| `NODE_VERSION` | `20` | Optional if `web/.node-version` is present; use if build fails on Node 18 |

Do **not** set `VITE_INGEST_SECRET` in Cloudflare unless you intentionally expose ingest from the public web UI (not recommended for production).

After changing env vars, trigger **Retry deployment** so the new values are embedded in the bundle.

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
2. Confirm the news feed loads (not “Request timed out”).
3. DevTools → **Network** → confirm requests go to `https://cursorunofficialnews.fly.dev/v1/news` (not `/api`).
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
| Feed timeout / empty | API down or wrong `VITE_API_BASE` | Check Fly health; redeploy after fixing env |
| 404 on refresh / deep link | Missing SPA fallback | `not_found_handling: "single-page-application"` in `wrangler.jsonc` |
| `_redirects` infinite loop (100324) | `/* /index.html 200` conflicts with wrangler SPA handling | Remove `web/public/_redirects`; rely on `not_found_handling` only |
| CORS errors | Unlikely — API uses open CORS | Check browser console; confirm API URL is HTTPS |
| Domain not resolving | NS propagation or wrong zone | Cloudflare zone **Active**; check **DNS** records for Worker custom domain |
| Email not sending | Resend, not Cloudflare | Verify domain in Resend; set Fly secrets per [FLY-DEPLOY.md](FLY-DEPLOY.md) |

---

## Alternative: Cloudflare Pages

You can also deploy via **Pages** with **Root directory** → `web`, **Build command** → `npm run build`, **Build output directory** → `dist` (relative to `web/`). The current repo setup targets **Workers Static Assets** + `wrangler.jsonc` at repo root.

---

## Related docs

- [FLY-DEPLOY.md](FLY-DEPLOY.md) — API on Fly.io (must be up first)
- [RUN-LOCAL.md](RUN-LOCAL.md) — local dev (Vite proxy to `:8787`)
- [AGENT-CONTEXT.md](AGENT-CONTEXT.md) — agent cold start
