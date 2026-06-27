# Deploy Web to Cloudflare Pages

Host the **Vite + React web preview** (`web/`) on Cloudflare Pages. The API stays on Fly.io — the web app calls it at build time via `VITE_API_BASE`.

| Layer | Host | URL |
|---|---|---|
| Web (static) | Cloudflare Pages | `https://cursorunofficial.news` (or `www`) |
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

3. **Push this repo to GitHub** — Cloudflare Pages connects to the GitHub repo for automatic builds on push.

4. **Resend domain verification (separate)** — Email digests use Resend + Fly secrets, not Cloudflare Pages. If you plan to send from `@cursorunofficial.news`, verify the domain in the [Resend dashboard](https://resend.com/domains) and add the DNS records Resend provides (can live alongside Pages DNS in Cloudflare). This does **not** block the web deploy.

---

## Repo artifacts (already in `web/`)

| File | Purpose |
|---|---|
| `web/public/_redirects` | SPA fallback — deep links serve `index.html` |
| `web/public/_headers` | Minimal security headers on static assets |
| `web/.node-version` | Node 20 for Cloudflare build (Vite 7 requires Node 20+) |
| `web/.env.example` | Documents `VITE_API_BASE` for local vs production |

Vite copies `public/` into `dist/` at build time, so `_redirects` and `_headers` land in the Pages output automatically.

---

## Cloudflare Pages — dashboard setup

### 1. Create the Pages project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Select the **cursorunofficial.news** zone (or your account if zone is elsewhere).
3. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
4. Authorize GitHub if prompted; select repo **`ezequielcasillas1/cursorunofficialnews`**.
5. Project name suggestion: `cursorunofficial-news` (or any name you prefer).

### 2. Build settings

On the **Set up builds and deployments** screen (or later under **Settings → Builds & deployments**):

| Setting | Value |
|---|---|
| **Production branch** | `main` (or your default branch) |
| **Framework preset** | None |
| **Root directory** | `web` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

Cloudflare runs `npm ci` or `npm install` inside `web/` before the build command.

### 3. Environment variables (build-time)

Under **Settings → Environment variables**, add for **Production** (and **Preview** if you want preview deploys to hit prod API):

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_BASE` | `https://cursorunofficialnews.fly.dev` | **Required** — baked into the JS bundle at build time |
| `NODE_VERSION` | `20` | Optional if `web/.node-version` is present; use if build fails on Node 18 |

Do **not** set `VITE_INGEST_SECRET` in Cloudflare unless you intentionally expose ingest from the public web UI (not recommended for production).

After changing env vars, trigger **Retry deployment** so the new values are embedded in the bundle.

### 4. Deploy

- Save settings → Cloudflare runs the first build.
- Watch **Deployments** for build logs; a successful build gets a `*.pages.dev` URL.

### 5. Custom domain

1. **Workers & Pages** → your project → **Custom domains** → **Set up a custom domain**.
2. Add **`cursorunofficial.news`** (apex).
3. Cloudflare creates the DNS records automatically because the zone is on Cloudflare.
4. Optional: add **`www.cursorunofficial.news`** and set a redirect (apex → www or www → apex) under **Rules → Redirect Rules** if you want a single canonical host.

SSL/TLS is automatic (Cloudflare Universal SSL). No extra cert step for Pages + proxied DNS.

### 6. Verify the live site

1. Open `https://cursorunofficial.news` (or your `*.pages.dev` URL before DNS is wired).
2. Confirm the news feed loads (not “Request timed out”).
3. DevTools → **Network** → confirm requests go to `https://cursorunofficialnews.fly.dev/v1/news` (not `/api`).
4. Optional smoke test from PowerShell:

   ```powershell
   Invoke-RestMethod "https://cursorunofficialnews.fly.dev/v1/news?limit=1"
   ```

---

## Local production-like preview

From `web/`:

```powershell
cd C:\Dev\CursorAINews\web
$env:VITE_API_BASE="https://cursorunofficialnews.fly.dev"
npm run build
npm run preview
```

Open the URL Vite prints (usually `http://127.0.0.1:4173`).

---

## Troubleshooting

### `PROJECT CANNOT BE FOUND` (most common first)

1. **GitHub app cannot see the repo (private repo)** — This repo is **private**. During Cloudflare → **Connect to Git**, the GitHub **Cloudflare Workers & Pages** app must include `ezequielcasillas1/cursorunofficialnews` under **Repository access**.
   - GitHub → **Settings** → **Integrations** → **Applications** → **Cloudflare Workers and Pages** → **Configure**
   - Set **Repository access** → **Only select repositories** → add **`cursorunofficialnews`**
   - Or use **All repositories** temporarily, then retry **Workers & Pages** → **Create** → **Pages** → **Connect to Git**

2. **Pages project not created yet** — The error appears if you open a project URL or custom domain before the first Pages project exists. Create it: **Workers & Pages** → **Create** → **Pages** (not Workers) → **Connect to Git** → pick **`ezequielcasillas1/cursorunofficialnews`**.

3. **Wrong Cloudflare account** — Domain zone `cursorunofficial.news` and the Pages project must live under the **same** Cloudflare account. Log out/in or check the account switcher in the dashboard.

4. **Repo already linked on another Cloudflare account** — One GitHub repo can only back one Pages project across all Cloudflare accounts. Error: *"This repository is being used for a Cloudflare Pages project on a different Cloudflare account."* Delete the old Pages project on the other account, or use **Direct Upload** / a different repo.

5. **Stale GitHub authorization** — Uninstall **Cloudflare Workers and Pages** from GitHub (Applications page), then reconnect from the Cloudflare Pages **Connect to Git** flow.

6. **Fly.io API not deployed** — Does **not** cause "PROJECT CANNOT BE FOUND", but the site will fail after deploy. `https://cursorunofficialnews.fly.dev/health` must respond before you rely on the live feed. See [FLY-DEPLOY.md](FLY-DEPLOY.md).

| Symptom | Likely cause | Fix |
|---|---|---|
| `Missing script: "build"` | Pages **root directory** left at repo root (default) instead of `web` | Set **Root directory** → `web`, **Build output** → `dist`. Or keep repo root: **Build command** → `npm run build`, **Build output** → `web/dist` (root `package.json` delegates to `web/`) |
| `PROJECT CANNOT BE FOUND` | Private repo not granted to Cloudflare GitHub app, no Pages project yet, or wrong Cloudflare account | See numbered list above |
| Build fails on Node | Default Node 18 | Set `NODE_VERSION=20` or rely on `web/.node-version` |
| Feed timeout / empty | API down or wrong `VITE_API_BASE` | Check Fly health; redeploy Pages after fixing env |
| 404 on refresh / deep link | Missing SPA fallback | Ensure `web/public/_redirects` is committed and in `dist/` |
| CORS errors | Unlikely — API uses open CORS | Check browser console; confirm API URL is HTTPS |
| Domain not resolving | NS propagation or wrong zone | Cloudflare zone **Active**; check **DNS** records for Pages |
| Email not sending | Resend, not Pages | Verify domain in Resend; set Fly secrets per [FLY-DEPLOY.md](FLY-DEPLOY.md) |

---

## Related docs

- [FLY-DEPLOY.md](FLY-DEPLOY.md) — API on Fly.io (must be up first)
- [RUN-LOCAL.md](RUN-LOCAL.md) — local dev (Vite proxy to `:8787`)
- [AGENT-CONTEXT.md](AGENT-CONTEXT.md) — agent cold start
