# Buy Me a Coffee — Go-Live Checklist

Membership + ad-free flow is implemented in `mobile/server/` and `web/`. **BMC webhooks go directly to Fly.io** — Pipedream is not in this path.

```
buymeacoffee.com webhooks
  → POST https://cursorunofficialnews.fly.dev/v1/bmc/webhook
  → bmc-members.json (Fly volume)

Web (cursorunofficial.news)
  → /api/v1/membership/claim
  → /api/v1/membership/status
```

---

## Prerequisites

1. Buy Me a Coffee account with **Memberships** enabled
2. Fly API deployed — [FLY-DEPLOY.md](FLY-DEPLOY.md)
3. Cloudflare web deployed — [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md)

---

## Step 1 — BMC dashboard

### 1a. Enable Memberships (required — tier links 404 without this)

1. [buymeacoffee.com](https://www.buymeacoffee.com) → your page → **Membership** (or **Extras → Membership**)
2. Click **Enable membership** / **Set up membership**
3. Create monthly tiers matching the app ($1, $2, $3, $4, $5) — names can differ; prices should match
4. After save, verify `https://buymeacoffee.com/<your-slug>/membership` loads (not 404)

Until memberships are enabled, tier buttons link to your main BMC page (`buymeacoffee.com/<slug>`) so users are not sent to a dead `/membership` URL.

Optional: copy each tier’s checkout URL from BMC and set `VITE_BMC_TIER_URL_1` … `VITE_BMC_TIER_URL_5` in Cloudflare for direct tier checkout.

### 1b. Webhooks

1. **Extras** → **Webhooks**
2. Add webhook URL: `https://cursorunofficialnews.fly.dev/v1/bmc/webhook`
3. Subscribe to membership events (`membership.started`, `membership.updated`, `membership.cancelled`). Pause/resume is handled via `membership.updated` (check `paused` in payload) and optional pause/resume event names if BMC adds them.
4. Copy the **webhook secret**

Note your **page slug** (username in `buymeacoffee.com/<slug>`).

### Webhook events handled

| Event / signal | Effect |
|---|---|
| `membership.started`, `membership.updated` (active) | Ad-free activated |
| `membership.updated` with `paused: true` (or status `paused` / `on_hold`) | Ad-free removed; status `paused` |
| `membership.paused`, `membership_paused`, `membership.on_hold`, `membership.pause` (+ `_` variants) | Ad-free removed; status `paused` |
| `membership.resumed`, `membership_resumed`, `membership.unpaused` (+ `_` variants) | Ad-free reactivated |
| `membership.cancelled` (without pause flag) | Ad-free removed; status `cancelled` |

BMC may send pause via `membership.updated` or `membership.cancelled` with a `paused` / `isPaused` field rather than a dedicated pause event — the handler checks payload fields on every event.

---

## Step 2 — Fly.io secrets

From repo root:

```powershell
cd C:\Dev\CursorAINews

fly secrets set `
  BMC_WEBHOOK_SECRET="your-webhook-secret-from-bmc" `
  PUBLIC_WEB_BASE="https://cursorunofficial.news"
```

| Secret | Required | Notes |
|---|---|---|
| `BMC_WEBHOOK_SECRET` | Yes | HMAC secret from BMC webhooks page |
| `PUBLIC_WEB_BASE` | Yes | Used in welcome/activation links in emails |
| `BMC_DEV_ADFREE_EMAILS` | Dev only | Comma-separated test emails; omit in production |

Verify webhook endpoint responds (503 = secret not set yet):

```powershell
Invoke-RestMethod https://cursorunofficialnews.fly.dev/health
```

---

## Step 3 — Cloudflare build env (`VITE_BMC_USERNAME`)

1. Cloudflare Dashboard → **Workers & Pages** → **cursorunofficialnews**
2. **Settings** → **Variables and Secrets** → **Production**
3. Add build variable:

| Variable | Value |
|---|---|
| `VITE_BMC_USERNAME` | Your BMC page slug (no URL prefix) |

Optional tier checkout URLs (override default membership page):

- `VITE_BMC_TIER_URL_1` … `VITE_BMC_TIER_URL_5`

4. **Redeploy** (push to `main` or manual retry deployment)

Local web test:

```powershell
cd C:\Dev\CursorAINews\web
Copy-Item .env.example .env.local
# Set VITE_BMC_USERNAME=yourslug in .env.local
npm run dev
```

---

## Step 4 — Smoke test

1. Open `https://cursorunofficial.news` — membership CTA should appear (not hidden)
2. Subscribe via BMC (or use dev email override on Fly)
3. Claim ad-free: `POST /api/v1/membership/claim` with subscriber email
4. Check status: `GET /api/v1/membership/status?email=you@example.com`

Dev shortcut (Fly secret or local `.env`):

```powershell
# mobile/server/.env.local
BMC_DEV_ADFREE_EMAILS=you@example.com
```

Web dev ad-free without webhook:

```powershell
# web/.env.local
VITE_BMC_DEV_ADFREE=true
```

---

## Related files

| File | Purpose |
|---|---|
| `mobile/server/src/monetization/bmc-webhook.js` | Webhook handler |
| `mobile/server/src/monetization/membership-routes.js` | Claim + status API |
| `web/src/monetization/config.js` | `VITE_BMC_*` env |
| `web/.env.example` | Web monetization vars |
| `mobile/server/.env.example` | API BMC vars |
