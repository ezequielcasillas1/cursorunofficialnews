# Run Cursor AI News Locally (Windows)

Plain step-by-step guide to see **both** the API feed and the mobile newsletter UI working on your machine.

> **Important:** The API is no longer a separate Express server in `mobile/server/` — it's part of the same Cloudflare Worker as the website, in **`web/worker/`**. Run it locally with `wrangler dev` (`npm run dev:api`). Fly.io is retired.

---

## Prerequisites

1. **Node.js 18+** (tested on **Node 24** on Windows) — check with `node -v` in PowerShell.
2. **Two PowerShell windows** — one for the API, one for Expo.
3. **Android Dev Client already built** — this app uses a custom dev client, **not Expo Go**. If you have never built it, do Step A4 once before Step C.
4. **Physical Android phone (recommended):**
   - USB debugging enabled
   - Phone connected by USB
   - **adb** available (Android SDK Platform Tools). Check with `adb devices`.
5. **Optional:** A browser on your PC to sanity-check the API (Step F) or the web feed (Step G).

---

## Step A — One-time setup

### A1. Open PowerShell and go to the project

```powershell
cd C:\Dev\CursorAINews
```

### A2. Install dependencies (both API and mobile)

From repo root:

```powershell
npm run install:all
```

Or manually:

```powershell
cd C:\Dev\CursorAINews
npm install

cd C:\Dev\CursorAINews\mobile
npm install

cd C:\Dev\CursorAINews\web
npm install
```

### A3. (Physical Android only) Forward port 8787 over USB

Run this **each time** you plug in the phone (or after a reboot):

```powershell
adb reverse tcp:8787 tcp:8787
```

This lets the phone reach your PC’s API at `http://127.0.0.1:8787`.

**Alternative (Wi‑Fi, no USB):** Copy `mobile/.env.example` to `mobile/.env` and set your PC’s LAN IP:

```
EXPO_PUBLIC_API_BASE=http://192.168.x.x:8787
```

Replace `192.168.x.x` with your PC’s IP (`ipconfig` → IPv4 Address). Restart Expo after changing `.env`.

**Push alerts:** copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_ENABLE_PUSH=true`. Restart Metro after any `.env` change (no native rebuild needed if the dev client was already built with `expo-notifications`).

### A4. (First time only) Build the Android dev client

Skip if you already have **“Unofficial Cursor News”** installed on your phone from a previous `expo run:android`.

```powershell
cd C:\Dev\CursorAINews\mobile
npm run android
```

(`npm run android` wraps `npx expo run:android` and auto-detects `JAVA_HOME` / `ANDROID_HOME` on Windows.)

Requires Java (`JAVA_HOME`) and Android SDK. This installs the dev client on your phone/emulator.

**Windows build fails with “Filename longer than 260 characters”:** `npm run android` and `gradlew.bat` already set `GRADLE_USER_HOME=C:\g` to avoid this. If a prior failed build left bad native caches, run `$env:CAIN_CLEAN_NATIVE="1"; npm run android` once.

### A5. After adding native dependencies — rebuild dev client

**When you need this:** Any time you add or upgrade packages that ship native code (e.g. `expo-font`, `expo-linear-gradient`, `@react-native-async-storage/async-storage`, `react-native-svg`, `expo-notifications`). JS-only changes do **not** require a rebuild.

Symptoms if you skip rebuild:

- `Cannot find native module 'ExpoFontLoader'`
- `ExpoLinearGradient ... isn't exported by expo-modules-core`
- `[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null`
- Missing SVG icons from `lucide-react-native`

**Fix (PowerShell, phone connected or emulator running):**

1. **Uninstall** the old dev client from the phone/emulator (Settings → Apps → Unofficial Cursor News → Uninstall). A partial reinstall can leave a stale native binary.
2. Regenerate native project and rebuild:

```powershell
cd C:\Dev\CursorAINews\mobile
npm install
npx expo prebuild --platform android --clean
npm run android
```

When prebuild asks about **uncommitted git changes**, answer **`y`** (yes) so it can delete and regenerate `android/`. If you prefer to skip that prompt:

```powershell
$env:EXPO_NO_GIT_STATUS=1; npx expo prebuild --platform android --clean
```

3. Restart Metro with a clean cache and reopen the dev client:

```powershell
cd C:\Dev\CursorAINews\mobile
npx expo start --dev-client --reset-cache
```

### A6. Server API env (`env/server/.env`)

One-time before local hardening or **before deploy**. Secrets stay on your machine — never commit `.env`.

```powershell
cd C:\Dev\CursorAINews
Copy-Item env\server.example.env env\server\.env
```

If `.env` already exists, **merge missing keys only** from `env/server.example.env` — do not overwrite your `RESEND_API_KEY`, `INGEST_SECRET`, or other secrets.

Generate a strong ingest secret (PowerShell):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `INGEST_SECRET=` in `env/server/.env` to that value. Local dev defaults (already in `env/server.example.env`):

| Variable | Local default | Notes |
|----------|---------------|--------|
| `PORT` | `8787` | Local `wrangler dev` port |
| `PUSH_NOTIFICATIONS` | `true` | Set `false` to disable Expo push |
| `EMAIL_NOTIFICATIONS` | `true` | Set `false` to disable email digests |
| `RESEND_API_KEY` | *(empty)* | Omit or leave empty to skip email sends gracefully |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | **Sandbox only** — verify your domain in [Resend](https://resend.com/domains) and use your verified address in production |
| `PUBLIC_API_BASE` | `http://127.0.0.1:8787/api` | Production: `https://cursorunofficial.news/api` (unsubscribe links) |
| `INGEST_SECRET` | *(generate)* | Required in production (checked against `ENVIRONMENT=production`) |
| `REGISTER_SECRET` | *(empty)* | Optional; protects device register endpoints |

In production these become `wrangler secret put` values, not `.env` — see [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md). Scheduled ingest is a Cloudflare Cron Trigger (`wrangler.jsonc` → `triggers.crons`), not `INGEST_CRON_ENABLED`.

Restart `wrangler dev` after changing `.env`.

---

## Step B — Terminal 1: Start the API

```powershell
cd C:\Dev\CursorAINews
$env:NODE_OPTIONS="--use-system-ca"   # needed behind corporate TLS/Zscaler
npm run dev:api
```

This runs `wrangler dev` — a real local Workers runtime with D1 (local SQLite emulation) and a real Workers AI binding (remote, needs `wrangler login` once).

**First time only** — seed local D1 with the schema:

```powershell
npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/schema.sql
```

**You should see:** `Ready on http://127.0.0.1:8787`

Leave this window open.

**Production deploy:** see [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md). All data lives in Cloudflare D1, not local JSON files.

**Quick check (optional, new PowerShell tab):**

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

Expected: `{ "ok": true }`

If you see **“Port 8787 already in use”**, another API is already running — that’s fine if `/health` returns ok. Stop the old process or use that instance.

---

## Step C — Terminal 2: Start Expo (mobile app)

```powershell
cd C:\Dev\CursorAINews
npm run dev:mobile
```

Or:

```powershell
cd C:\Dev\CursorAINews\mobile
npx expo start --dev-client
```

**You should see:** Metro bundler with a QR code and menu options.

Leave this window open.

---

## Step D — Open the app on your device

1. Open the **Unofficial Cursor News** dev client on your phone (not Expo Go).
2. If prompted, connect to the Metro URL shown in Terminal 2 (scan QR or enter URL).
3. Wait for the bundle to load.

**Android emulator:** No `adb reverse` needed — the app defaults to `http://10.0.2.2:8787`.

---

## Step E — What you should SEE

### In the mobile app (newsletter UI)

- **Masthead** at the top (“Unofficial Cursor News” style header).
- **Category tabs** — All, Updates, News, Forum, etc.
- **Headline cards** with titles, dates, and source badges (e.g. Official).
- **Disclaimer** banner — unofficial fan project notice.
- **Pull down to refresh** — reloads feed from the API.
- **Tap a card** — opens the original article in the browser.

### If the feed is empty

- Pull to refresh once (triggers ingest on the server).
- Or in a browser/Postman: `POST http://127.0.0.1:8787/api/v1/ingest` then refresh the app.

### On the API (browser or curl)

- Status page shows item count and last ingest time.
- News endpoint returns JSON with headline items.

---

## Step F — Quick API checks in browser

Open these URLs on your PC (while Terminal 1 is running):

| URL | What it shows |
|-----|----------------|
| http://127.0.0.1:8787/health | `{ "ok": true }` |
| http://127.0.0.1:8787/api/v1/status | Item count, last ingest time |
| http://127.0.0.1:8787/api/v1/news?limit=3 | First 3 news items as JSON |
| http://127.0.0.1:8787/api/v1/sources | Registered feed sources |

PowerShell equivalents:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/v1/status
Invoke-RestMethod "http://127.0.0.1:8787/api/v1/news?limit=3"
```

Note: the mobile app calls `${API_BASE}/v1/...` directly against a bare host (no `/api` prefix) in its own config, while the web frontend and the URLs above go through the Worker's `/api` mount. Both reach the same Hono app.

---

## Step G — Web preview (optional)

While Terminal 1 (API) is running, open a **third** terminal:

```powershell
cd C:\Dev\CursorAINews
npm run dev:web
```

Or:

```powershell
cd C:\Dev\CursorAINews\web
npm run dev
```

Open **http://127.0.0.1:5173** in your browser.

### What you should see

- Navy masthead with **Unofficial Cursor News**
- Disclaimer banner
- Category filter chips (All, Changelog, Releases, …)
- News cards with title, excerpt, date, and **Open original** link
- **Refresh feed** runs `POST /v1/ingest` then reloads the list

### How it connects

| Setting | Default | Notes |
|---------|---------|--------|
| Vite dev server | `:5173` | `web/vite.config.js` |
| API proxy | `/api` → `http://127.0.0.1:8787` | Same Worker as mobile — no path rewrite (Worker expects `/api/*` itself) |
| Direct API URL | `VITE_API_BASE=http://127.0.0.1:8787/api` | Optional in `web/.env` |

If `env/server/.env` sets **`INGEST_SECRET`**, copy `web/.env.example` → `web/.env` and set the same value as **`VITE_INGEST_SECRET`** so Refresh works.

---

## Troubleshooting

| **Web shows “Request failed” / empty feed** | API running? Check http://127.0.0.1:8787/health. Start web with `npm run dev:web` after API. |
| **Web Refresh → Unauthorized** | Set `VITE_INGEST_SECRET` in `web/.env` to match `INGEST_SECRET` in `env/server/.env`. |
| **Connection refused / can’t reach API** | Terminal 1 (`wrangler dev`) running? Try `/health` in browser. On physical phone, run `adb reverse tcp:8787 tcp:8787` again. |
| **Wrong API URL on error screen** | Phone shows `http://127.0.0.1:8787/api` — that only works with `adb reverse`. Without USB, set `EXPO_PUBLIC_API_BASE` in `mobile/.env` to `http://<PC LAN IP>:8787/api`. |
| **Empty feed after refresh** | Run ingest: `Invoke-RestMethod -Method POST http://127.0.0.1:8787/api/v1/ingest` (add `-Headers @{ 'X-API-Secret' = $env:INGEST_SECRET }` if `INGEST_SECRET` is set). |
| **Port 8787 already in use** | Another `wrangler dev` instance is running — use it, or find and stop the process (`netstat -ano \| findstr 8787`). |
| **Expo Go instead of dev client** | This project needs the custom dev client. Run `npx expo run:android` from `mobile/` once. |
| **Missing fonts / SVG icons / ExpoFontLoader / ExpoLinearGradient errors** | Native deps changed without rebuilding. Follow **Step A5** (uninstall app → `prebuild --clean` → `npm run android` → `--reset-cache`). |
| **`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null`** | Same as above — `@react-native-async-storage/async-storage` is native; the installed APK was built before it was linked. Uninstall app, then **Step A5**. |
| **Ingest fails (TLS / corporate network)** | Run `wrangler dev` with `$env:NODE_OPTIONS="--use-system-ca"` for Zscaler. If it still hangs locally, it's a `workerd`-in-sandbox quirk, not the ingest code — production Cloudflare has no such issue. |
| **`npm run android` → `spawn EINVAL` (Node 24, Windows)** | Fixed in `scripts/run-android.js` (Windows runs `npx` via `cmd.exe`). Pull latest, then retry `npm run android`. |
| **Metro crash: ENOENT watch `node_modules/.../android/build/...`** | Fixed in `metro.config.js` (blockList excludes `node_modules/**/android` and `ios` build trees). Restart with `npx expo start --dev-client --reset-cache`. |
| **Prebuild stopped after git prompt** | Answer **`y`**, or set `$env:EXPO_NO_GIT_STATUS=1` before `npx expo prebuild --clean`. |

---

## Project layout (Cloudflare Worker replaces Fly.io)

```
C:\Dev\CursorAINews\
├── mobile\              ← Expo app (newsletter UI)
│   └── src\             ← screens, components, API client
├── web\                 ← website (Vite :5173 dev) + worker\ (Cloudflare Worker: API + D1 + AI + cron)
│   └── worker\          ← API + website Worker ← USE THIS (Fly.io is retired)
├── env\                 ← local .env files (gitignored) + committed .example.env templates
└── docs\                ← plans and this guide
```

**Root shortcuts:**

```powershell
npm run install:all   # install deps (root + mobile + web)
npm run dev:api        # start API (wrangler dev, :8787)
npm run dev:mobile    # start Expo
npm run dev:web       # start web preview (:5173, proxies /api → :8787)
```

---

## Deploying to production

There's no separate API host to prep anymore — deploying is one command from repo root once secrets are set (see [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) for the full one-time setup: D1 database, schema, secrets):

```powershell
npm run deploy:web
```

Smoke test after deploy:

```powershell
Invoke-RestMethod https://cursorunofficial.news/health
Invoke-RestMethod https://cursorunofficial.news/api/v1/status
```

Data lives in Cloudflare D1 (`news_items`, `email_subscribers`, `device_tokens`, `memberships`, etc.) — no server filesystem to back up.

---

## Next: Phase 5 — Notifications

Before testing push alerts:

1. **Rebuild the dev client** after any native change (`expo-notifications` is already in the app):
   ```powershell
   cd C:\Dev\CursorAINews\mobile
   npm run android
   ```
2. **Enable push in env** — set `EXPO_PUBLIC_ENABLE_PUSH=true` in `mobile/.env`, then **restart Metro** (`npx expo start --dev-client`). Env-only changes do not require `npm run android` if the dev client already includes `expo-notifications`.
3. **Use a physical device** — push tokens and delivery don’t work reliably on emulators.
4. **Keep both terminals running** — API (`wrangler dev`) must be up for ingest + device registration (`POST /api/v1/devices/register`).
5. **Test flow:** subscribe to a category in Notification Settings → trigger new items via ingest → confirm one alert (no duplicate spam).

See `docs/CURSOR-AI-NEWS-PHASE-PLAN.md` Phase 5 for full scope.
