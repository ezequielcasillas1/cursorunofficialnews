# Stripe Membership — Go-Live Checklist

Membership (ad-free + email newsletter unlock) runs entirely in `web/worker/` (Cloudflare Worker) + `web/`. Replaces Buy Me a Coffee — see `bmc_members` deprecation note in `web/worker/src/db/schema.sql`.

```
Stripe Checkout + webhooks
  → POST https://cursorunofficial.news/api/v1/stripe/webhook
  → memberships table (D1)

Web (cursorunofficial.news)
  → POST /api/v1/membership/checkout        (start Checkout Session)
  → GET  /api/v1/membership/checkout/confirm (post-redirect confirm)
  → POST /api/v1/membership/claim(/verify)   (restore on new device)
  → GET  /api/v1/membership/status           (poll entitlement)
  → GET  /api/v1/membership/refund/eligibility (refund eligibility — $4+/mo)
  → POST /api/v1/membership/refund           (request full refund + cancel)
```

---

## Stripe objects (Product/Prices)

**Use one Product with five Prices** — not five separate products.

| Approach | Why |
|---|---|
| **One product + 5 prices** (recommended) | Matches `STRIPE_PRICE_ID_1`…`5` in the worker; every tier unlocks the same entitlements (`adFree` + `newsletterUnlocked`); simpler Dashboard reporting and one place to edit the product description. |
| Five products | Would work technically but adds clutter — benefits do not differ by tier, only the monthly amount does. |

Create in **Test mode** first (toggle in Stripe Dashboard), then repeat in Live when ready.

---

### Copy-paste: Product (create once)

| Field | Value |
|---|---|
| **Name** | `Unofficial Cursor News — Membership` |
| **Description** | `Monthly supporter membership for Unofficial Cursor News (cursorunofficial.news) — an independent fan project, not affiliated with Cursor or Anysphere. Every tier unlocks the same benefits: ad-free feed browsing and the email newsletter on web and mobile. Choose $1–$5/mo based on what you want to contribute. Cancel anytime; access stays active while your subscription is active.` |

---

### Copy-paste: Prices (add five to the product above)

All prices: **Recurring · Monthly · USD**. After each price is saved, copy its Price ID (`price_...`) into the matching worker secret (`STRIPE_PRICE_ID_1` … `STRIPE_PRICE_ID_5`).

| Amount | Price nickname (Dashboard) | Price description (optional) |
|---|---|---|
| **$1.00 / mo** | `Community Supporter — $1/mo` | `Entry-level support. Same member perks as every tier: ad-free browsing and email newsletter access for Unofficial Cursor News.` |
| **$2.00 / mo** | `Feed Friend — $2/mo` | `Pay-what-you-want tier. Unlocks ad-free feed browsing and the membership email newsletter. Independent fan project — not affiliated with Cursor.` |
| **$3.00 / mo** | `Steady Supporter — $3/mo` | `Mid-tier monthly support. Full member benefits: ad-free browsing, email newsletter, and restore access on new devices via email verification.` |
| **$4.00 / mo** | `Newsletter Patron — $4/mo` | `Stronger support for hosting, ingest, and newsletter delivery. Same entitlements as all tiers: ad-free feed + email newsletter while active. Refund available on request if you are not satisfied.` |
| **$5.00 / mo** | `Core Supporter — $5/mo` | `Top supporter tier. Maximum monthly contribution with the same member unlocks: ad-free browsing and email newsletter for Unofficial Cursor News. Refund available on request if you are not satisfied.` |

**Dashboard steps:** Products → **Add product** → paste name + description → under Pricing add the first recurring monthly price → **Save product** → open the product → **Add another price** for tiers $2–$5.

**Not yet created in Stripe** — create these objects in Test mode for localhost work, then record the five Price IDs in worker secrets (below).

---

### Fast price ID extraction

**Product ID vs Price ID — why IDs look “the same”**

| ID prefix | What it is | Count for membership |
|---|---|---|
| `prod_...` | **Product** — the membership offering itself | **One** — same ID on every price row for that product |
| `price_...` | **Price** — one recurring monthly amount | **Five** — one unique `price_...` per $1–$5 tier |

If every tier shows the same ID, you are almost certainly copying the **Product ID** (`prod_...`) from the product header or URL — not the **Price ID** (`price_...`) from each pricing row. Price IDs also share a long common prefix (account + timestamp); only the last few characters differ — that is normal.

**Use the consolidated product** (one `prod_...` with five prices). If you previously created five separate products (one per dollar amount), each has its own `prod_...` — ignore those; use prices under the single “Unofficial Cursor News — Membership” product instead.

**Map by dollar amount** — `STRIPE_PRICE_ID_N` = the `price_...` whose amount is **$N/mo** (Stripe stores `unit_amount` in cents: 100 = $1, 200 = $2, …).

**Test vs Live** — Price IDs differ between Test and Live mode. Local dev uses `sk_test_...` + Test-mode `price_...` IDs; production uses `sk_live_...` + Live-mode IDs. Toggle **Test mode** in the Dashboard (top-right) before copying IDs for localhost.

---

## Live mode (production keys)

Use this when your Stripe Product/Prices already exist in **Live mode** (Dashboard toggle off Test mode).

### List live prices with Stripe CLI

The CLI defaults to your **test** key after `stripe login`. A live product ID with a test key returns *"product exists in live mode but a test mode key was used"*.

```powershell
# Option A — pass --live on each command (recommended)
stripe prices list --product prod_UoUsfmwa2Nygr6 --limit 10 --live

# Sort by dollar amount (requires jq)
stripe prices list --product prod_UoUsfmwa2Nygr6 --limit 10 --live | jq '.data[] | {id, dollars: (.unit_amount/100), currency}'

# Option B — point the CLI at your live secret key for the session
$env:STRIPE_API_KEY = "sk_live_..."   # paste from Dashboard → API keys (Live)
stripe prices list --product prod_UoUsfmwa2Nygr6 --limit 10
```

Map each `price_...` by **`unit_amount` (cents)** → env var:

| `unit_amount` | Env var | Tier |
|---|---|---|
| 100 | `STRIPE_PRICE_ID_1` | $1/mo |
| 200 | `STRIPE_PRICE_ID_2` | $2/mo |
| 300 | `STRIPE_PRICE_ID_3` | $3/mo |
| 400 | `STRIPE_PRICE_ID_4` | $4/mo |
| 500 | `STRIPE_PRICE_ID_5` | $5/mo |

### Local env (`env/server/.env`)

Set all of these, then restart `npm run dev:api`:

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...        # from a Live webhook endpoint (see below)
STRIPE_PRICE_ID_1=price_...            # unit_amount 100
STRIPE_PRICE_ID_2=price_...            # unit_amount 200
STRIPE_PRICE_ID_3=price_...            # unit_amount 300
STRIPE_PRICE_ID_4=price_...            # unit_amount 400
STRIPE_PRICE_ID_5=price_...            # unit_amount 500
```

**Remove or comment out** `MEMBERSHIP_DEV_EMAILS` when exercising real checkout locally — it still grants free membership in dev (see warnings below).

`npm run dev:api` forces `ENVIRONMENT=development` and `PUBLIC_WEB_BASE=http://127.0.0.1:5173`. The worker **does not block** `sk_live_...` keys in development; Stripe calls use whatever key is in `.env`.

### Production deploy (Cloudflare Worker secrets)

Non-secret config stays in `wrangler.jsonc` (`ENVIRONMENT=production`, `PUBLIC_WEB_BASE`, etc.). Stripe keys are **never** in that file — set via:

```powershell
cd C:\Dev\CursorAINews
npx wrangler secret put STRIPE_SECRET_KEY          # sk_live_...
npx wrangler secret put STRIPE_WEBHOOK_SECRET        # whsec_... from live endpoint
npx wrangler secret put STRIPE_PRICE_ID_1
npx wrangler secret put STRIPE_PRICE_ID_2
npx wrangler secret put STRIPE_PRICE_ID_3
npx wrangler secret put STRIPE_PRICE_ID_4
npx wrangler secret put STRIPE_PRICE_ID_5
```

Do **not** set `MEMBERSHIP_DEV_EMAILS` in production. See also `docs/CLOUDFLARE-DEPLOY.md` § Set secrets.

### Live webhook

Dashboard → **Developers → Webhooks** (Live mode) → endpoint URL:

`https://cursorunofficial.news/api/v1/stripe/webhook`

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `refund.updated`.

Copy the signing secret (`whsec_...`) immediately — it is shown once at creation.

`stripe listen` only forwards **test-mode** events. For live subscription lifecycle events locally you need either:

- the **confirm redirect** path (`GET /v1/membership/checkout/confirm?session_id=...`) after checkout, or
- a tunnel (ngrok, Cloudflare Tunnel) + a temporary Live webhook pointing at your tunnel URL.

### Risks — real money on localhost

| Risk | Detail |
|---|---|
| **Real charges** | Live Checkout charges real cards. No test card `4242…` — use a real card you control or cancel immediately in Stripe Dashboard. |
| **Separate D1** | Local `wrangler dev` uses a **local** D1 SQLite — live memberships activated locally do not appear in production D1 until you deploy and checkout on prod. |
| **Dev bypasses still active** | `ENVIRONMENT=development` enables `MEMBERSHIP_DEV_EMAILS` instant claim (no Stripe) and exposes `GET /v1/membership/members`. Web frontend: `VITE_MEMBERSHIP_DEV_ACTIVE=true` in `web/.env` skips all Stripe UI-side. Unset these before live checkout testing. |
| **Webhook mismatch** | Live `whsec_...` from Dashboard ≠ `stripe listen` test secret. Wrong secret → webhook returns `401`. |
| **Mixed keys** | `sk_live_...` + test `price_...` IDs (or vice versa) → Stripe API errors at checkout. Keys and price IDs must all be from the same mode. |

---

#### Method 1 — Stripe CLI (fastest bulk copy)

```powershell
stripe login
# All active prices (scan unit_amount column — cents)
stripe prices list --limit 20              # test mode (default)
stripe prices list --limit 20 --live       # live mode

# Only prices for your membership product (replace prod_... from Dashboard product URL)
stripe prices list --product prod_XXXXXXXXXXXX --limit 10
stripe prices list --product prod_XXXXXXXXXXXX --limit 10 --live
```

Pipe to JSON for sorting by amount:

```powershell
stripe prices list --product prod_XXXXXXXXXXXX --limit 10 | jq '.data[] | {id, dollars: (.unit_amount/100), currency}'
```

#### Method 2 — Dashboard

1. Toggle **Test mode** (for local dev).
2. **Product catalog → Products** → open **Unofficial Cursor News — Membership**.
3. In the **Pricing** table, each row has its own **Price ID** (`price_...`) — click the row or ⋯ menu → **Copy price ID**.
4. Do **not** copy the Product ID at the top (`prod_...`).

#### Method 3 — API / MCP

```powershell
# Replace sk_test_... and prod_...
curl "https://api.stripe.com/v1/prices?product=prod_XXXXXXXXXXXX&active=true&limit=10" ^
  -u sk_test_XXXXX:
```

Or ask the Stripe MCP: `GetPrices` with `{ "product": "prod_...", "active": true, "limit": 10 }` — match each `unit_amount` (cents) to `STRIPE_PRICE_ID_1`…`5`.

#### Paste into `env/server/.env`

```env
STRIPE_PRICE_ID_1=price_...   # $1/mo (unit_amount 100)
STRIPE_PRICE_ID_2=price_...   # $2/mo (unit_amount 200)
STRIPE_PRICE_ID_3=price_...   # $3/mo (unit_amount 300)
STRIPE_PRICE_ID_4=price_...   # $4/mo (unit_amount 400)
STRIPE_PRICE_ID_5=price_...   # $5/mo (unit_amount 500)
```

Restart `npm run dev:api` after saving.

---

## Step 1 — Worker secrets

```powershell
cd C:\Dev\CursorAINews
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put STRIPE_PRICE_ID_1
npx wrangler secret put STRIPE_PRICE_ID_2
npx wrangler secret put STRIPE_PRICE_ID_3
npx wrangler secret put STRIPE_PRICE_ID_4
npx wrangler secret put STRIPE_PRICE_ID_5
```

| Config | Required | Where | Notes |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Worker secret | `sk_test_...` locally, `sk_live_...` in prod — never commit |
| `STRIPE_WEBHOOK_SECRET` | Yes | Worker secret | `whsec_...` from the webhook endpoint (Dashboard reveals it once at creation) |
| `STRIPE_PRICE_ID_1`..`5` | Yes | Worker secret | Price IDs for the $1–$5/mo tiers |
| `PUBLIC_WEB_BASE` | Yes | `wrangler.jsonc` vars (already set) | Checkout success/cancel redirect base |
| `MEMBERSHIP_DEV_EMAILS` | Dev only | Worker secret | Comma-separated test emails; omit in production |

Local dev: put the same keys in `env/server/.env` (see `env/server.example.env`). `npm run dev:api` loads that file automatically via `wrangler dev --env-file`.

---

## Step 2 — Webhook endpoint

Dashboard → **Developers → Webhooks** → **Add endpoint**:

- URL: `https://cursorunofficial.news/api/v1/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Pause/resume is native Stripe subscription pause (`pause_collection`) surfaced via `customer.subscription.updated` — no separate event needed.

Copy the signing secret immediately (`whsec_...`) — it cannot be retrieved again later, only rotated.

---

## Step 3 — Local dev testing

```powershell
stripe login
stripe listen --forward-to http://127.0.0.1:8787/api/v1/stripe/webhook
# use the whsec_... it prints as your local STRIPE_WEBHOOK_SECRET
stripe trigger checkout.session.completed
```

Apply the D1 schema locally first (adds `memberships` table):

```powershell
npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/schema.sql
```

---

## Step 4 — Smoke test

1. `POST /api/v1/membership/checkout` with `{ "amount": 3 }` → expect `{ ok: true, url }`, redirect to Stripe.
2. Complete test-card checkout (`4242 4242 4242 4242`) → redirected back with `?membership_session_id=...`.
3. `GET /api/v1/membership/checkout/confirm?session_id=...` → expect `{ ok: true, adFree: true, newsletterUnlocked: true, token }`.
4. `GET /api/v1/membership/status?token=...` → expect `active`.
5. `POST /api/v1/email/subscribe` without `membershipToken` → expect `402` with the membership-required message.
6. `POST /api/v1/email/subscribe` with a valid `membershipToken` → expect success/pending as before.
7. POST a bad signature to `/api/v1/stripe/webhook` → expect `401`.

---

## Manual cleanup (not automated by this change)

- Legacy `bmc_members` D1 table is kept (not dropped) for now — reconcile/export any real historical BMC members, then drop the table manually once done.
- Remove the retired `BMC_WEBHOOK_SECRET` / `BMC_DEV_ADFREE_EMAILS` Worker secrets once confirmed unused: `npx wrangler secret delete BMC_WEBHOOK_SECRET`.

---

## Related files

| File | Purpose |
|---|---|
| `web/worker/src/monetization/stripe-client.js` | Stripe SDK client (Workers fetch/crypto adapters) |
| `web/worker/src/monetization/stripe-checkout.js` | Checkout Session creation + confirm retrieval |
| `web/worker/src/monetization/stripe-webhook.js` | Webhook signature verification + event handling |
| `web/worker/src/monetization/membership-routes.js` | Checkout, confirm, claim/restore, status API |
| `web/worker/src/store/memberships.js` | D1 CRUD + single-source-of-truth entitlement |
| `web/worker/src/notifications/email-routes.js` | Newsletter subscribe/resubscribe — membership-gated |
| `env/server.example.env` | Worker Stripe env vars |
