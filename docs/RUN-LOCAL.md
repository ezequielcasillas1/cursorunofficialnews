# Run Cursor AI News Locally (Windows)

Plain step-by-step guide to see **both** the API feed and the mobile newsletter UI working on your machine.

> **Important:** The API moved from the old `api/` folder to **`mobile/server/`**. The empty `api/` folder at the repo root can be ignored (or deleted).

---

## Prerequisites

1. **Node.js 18+** (tested on **Node 24** on Windows) — check with `node -v` in PowerShell.
2. **Two PowerShell windows** — one for the API, one for Expo.
3. **Android Dev Client already built** — this app uses a custom dev client, **not Expo Go**. If you have never built it, do Step A4 once before Step C.
4. **Physical Android phone (recommended):**
   - USB debugging enabled
   - Phone connected by USB
   - **adb** available (Android SDK Platform Tools). Check with `adb devices`.
5. **Optional:** A browser on your PC to sanity-check the API (Step F).

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
cd C:\Dev\CursorAINews\mobile\server
npm install

cd C:\Dev\CursorAINews\mobile
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

### A6. Server API env (`mobile/server/.env`)

One-time before local hardening or **before deploy**. Secrets stay on your machine — never commit `.env`.

```powershell
cd C:\Dev\CursorAINews\mobile\server
Copy-Item .env.example .env
```

If `.env` already exists, **merge missing keys only** from `.env.example` — do not overwrite your `RESEND_API_KEY`, `INGEST_SECRET`, or other secrets.

Generate a strong ingest secret (PowerShell):

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set `INGEST_SECRET=` in `.env` to that value. Local dev defaults (already in `.env.example`):

| Variable | Local default | Notes |
|----------|---------------|--------|
| `PORT` | `8787` | API listen port |
| `PUSH_NOTIFICATIONS` | `true` | Set `false` to disable Expo push |
| `EMAIL_NOTIFICATIONS` | `true` | Set `false` to disable email digests |
| `RESEND_API_KEY` | *(empty)* | Omit or leave empty to skip email sends gracefully |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | **Sandbox only** — verify your domain in [Resend](https://resend.com/domains) and use your verified address in production |
| `PUBLIC_API_BASE` | `http://127.0.0.1:8787` | Production: your public HTTPS API URL (unsubscribe links) |
| `INGEST_SECRET` | *(generate)* | Required when `NODE_ENV=production` |
| `REGISTER_SECRET` | *(empty)* | Optional; protects device register endpoints |
| `INGEST_CRON_ENABLED` | `false` | Keep off locally unless you want automatic ingests |
| `INGEST_CRON_SCHEDULE` | `*/30 * * * *` | Used only when cron is enabled |

Restart the API after changing `.env`.

---

## Step B — Terminal 1: Start the API

```powershell
cd C:\Dev\CursorAINews
npm run dev:api
```

Or:

```powershell
cd C:\Dev\CursorAINews\mobile\server
npm run dev
```

**You should see:** `Unofficial Cursor News API listening on http://127.0.0.1:8787`

Leave this window open.

**Production env (when deploying `mobile/server/`):** see **Pre-deploy checklist** below. Persistent state lives in `mobile/server/data/*.json` (gitignored).

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
- Or in a browser/Postman: `POST http://127.0.0.1:8787/v1/ingest` then refresh the app.

### On the API (browser or curl)

- Status page shows item count and last ingest time.
- News endpoint returns JSON with headline items.

---

## Step F — Quick API checks in browser

Open these URLs on your PC (while Terminal 1 is running):

| URL | What it shows |
|-----|----------------|
| http://127.0.0.1:8787/health | `{ "ok": true }` |
| http://127.0.0.1:8787/v1/status | Item count, last ingest time |
| http://127.0.0.1:8787/v1/news?limit=3 | First 3 news items as JSON |
| http://127.0.0.1:8787/v1/sources | Registered feed sources |

PowerShell equivalents:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/v1/status
Invoke-RestMethod "http://127.0.0.1:8787/v1/news?limit=3"
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Connection refused / can’t reach API** | Terminal 1 running? Try `/health` in browser. On physical phone, run `adb reverse tcp:8787 tcp:8787` again. |
| **Wrong API URL on error screen** | Phone shows `http://127.0.0.1:8787` — that only works with `adb reverse`. Without USB, set `EXPO_PUBLIC_API_BASE` in `mobile/.env` to your PC LAN IP. |
| **Empty feed after refresh** | Run ingest: `Invoke-RestMethod -Method POST http://127.0.0.1:8787/v1/ingest` (add `-Headers @{ 'X-API-Secret' = $env:INGEST_SECRET }` if `INGEST_SECRET` is set). Or: `cd mobile/server; node scripts/trigger-ingest.js` |
| **Port 8787 already in use** | Another API instance is running — use it, or find and stop the process (`netstat -ano \| findstr 8787`). |
| **Expo Go instead of dev client** | This project needs the custom dev client. Run `npx expo run:android` from `mobile/` once. |
| **Missing fonts / SVG icons / ExpoFontLoader / ExpoLinearGradient errors** | Native deps changed without rebuilding. Follow **Step A5** (uninstall app → `prebuild --clean` → `npm run android` → `--reset-cache`). |
| **`[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null`** | Same as above — `@react-native-async-storage/async-storage` is native; the installed APK was built before it was linked. Uninstall app, then **Step A5**. |
| **Ingest fails (TLS / corporate network)** | API already uses `node --use-system-ca` for Zscaler. If RSS still fails, check network/VPN. |
| **Still using old `api/` folder** | **Don’t.** Use `mobile/server/` only. Root `npm run dev:api` points there. |
| **`npm run android` → `spawn EINVAL` (Node 24, Windows)** | Fixed in `scripts/run-android.js` (Windows runs `npx` via `cmd.exe`). Pull latest, then retry `npm run android`. |
| **Metro crash: ENOENT watch `node_modules/.../android/build/...`** | Fixed in `metro.config.js` (blockList excludes `node_modules/**/android` and `ios` build trees). Restart with `npx expo start --dev-client --reset-cache`. |
| **Prebuild stopped after git prompt** | Answer **`y`**, or set `$env:EXPO_NO_GIT_STATUS=1` before `npx expo prebuild --clean`. |

---

## Project layout (after api → mobile/server merge)

```
C:\Dev\CursorAINews\
├── mobile\              ← Expo app (newsletter UI)
│   ├── server\          ← API server (port 8787) ← USE THIS
│   └── src\             ← screens, components, API client
├── web\                 ← optional browser preview
├── docs\                ← plans and this guide
└── api\                 ← empty legacy folder — ignore
```

**Root shortcuts:**

```powershell
npm run install:all   # install deps
npm run dev:api       # start API
npm run dev:mobile    # start Expo
```

---

## Pre-deploy checklist (production)

Complete **before** deploying `mobile/server/` to a host (VPS, Railway, Render, etc.).

### 1. Environment file

1. Copy `mobile/server/.env.example` → `mobile/server/.env` on the server (not in git).
2. Set **`NODE_ENV=production`** in your host’s env (platform UI or process manager).
3. Set **`INGEST_SECRET`** to a long random string (same generator as Step A6).
4. Set **`PUBLIC_API_BASE`** to your public HTTPS URL (e.g. `https://api.example.com`) — used in email unsubscribe links.
5. Optional: **`REGISTER_SECRET`** if you want to lock down `POST /v1/devices/register`.
6. **`RESEND_API_KEY`** — from Resend dashboard if email digests are enabled.
7. **`RESEND_FROM_EMAIL`** — must use an address on a **domain you verified in Resend** (the example `onboarding@resend.dev` is sandbox-only; we cannot verify your domain for you).
8. Leave **`INGEST_CRON_ENABLED=false`** locally; choose a cron strategy below for production.

`.env` and `mobile/server/.env` are gitignored — never commit secrets.

### 2. Scheduled ingest (pick one)

| Option | When to use | How |
|--------|-------------|-----|
| **In-process cron** | Single long-running Node process | `INGEST_CRON_ENABLED=true`, `INGEST_CRON_SCHEDULE=*/30 * * * *` — server runs ingest on schedule (same as `POST /v1/ingest`). |
| **External cron + script** | Platform cron, systemd timer, or separate worker | Keep `INGEST_CRON_ENABLED=false`. Schedule `mobile/server/scripts/trigger-ingest.js` (or `.ps1` / `.sh`) every 30 minutes. Script reads `.env` and sends `X-API-Secret`. |

**Windows (Task Scheduler or manual):**

```powershell
cd C:\Dev\CursorAINews\mobile\server
.\scripts\trigger-ingest.ps1
```

**Linux/macOS crontab example:**

```bash
*/30 * * * * cd /path/to/mobile/server && ./scripts/trigger-ingest.sh >> /var/log/cursor-news-ingest.log 2>&1
```

**Node directly (any OS):**

```powershell
cd C:\Dev\CursorAINews\mobile\server
node scripts/trigger-ingest.js
```

### 3. Smoke test after deploy

```powershell
Invoke-RestMethod https://YOUR_API/health
# With secret set:
Invoke-RestMethod -Method POST https://YOUR_API/v1/ingest -Headers @{ 'X-API-Secret' = 'YOUR_INGEST_SECRET' }
Invoke-RestMethod https://YOUR_API/v1/status
```

### 4. Data persistence

Ensure `mobile/server/data/` is writable and backed up (`known-items.json`, device tokens, email subscribers). Files are gitignored.

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
4. **Keep both terminals running** — API (`mobile/server`) must be up for ingest + device registration (`POST /v1/devices/register`).
5. **Test flow:** subscribe to a category in Notification Settings → trigger new items via ingest → confirm one alert (no duplicate spam).

See `docs/CURSOR-AI-NEWS-PHASE-PLAN.md` Phase 5 for full scope.
