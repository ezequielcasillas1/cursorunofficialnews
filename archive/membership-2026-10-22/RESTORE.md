# Membership & paid newsletter backup (2026-10-22)

Snapshot of Stripe membership, paywall UI, newsletter entitlement gating, n8n digest trigger, and related admin tooling **before** removal from the live site. Database tables on production D1 were **not** dropped.

## What is in this folder

Paths mirror the repo layout at backup time:

| Area | Location in archive |
|------|---------------------|
| Web paywall UI | `web/src/components/monetization/`, `web/src/monetization/`, `web/src/pages/MembershipUnsubscribePage.jsx` |
| Worker Stripe/membership API | `web/worker/src/monetization/` |
| Membership stores & entitlement | `web/worker/src/store/membership*.js`, `web/worker/src/lib/membership-*.js` |
| n8n cron webhook client | `web/worker/src/jobs/trigger-n8n-newsletter.js` (+ test) |
| n8n workflow export | `docs/n8n/cursor-ai-news-newsletter.workflow.json`, `docs/n8n/README.md` |
| Stripe go-live notes | `docs/STRIPE-GO-LIVE.md` |
| Local membership admin UI | `web/admin/` |
| Mobile membership config | `mobile/shared/monetization/`, `mobile/src/monetization/` |
| D1 membership DDL excerpt | `web/worker/src/db/schema-membership-tables.sql` |

Git tag on the commit **immediately before** live removal: `membership-backup-2026-10-22`.

## Cloudflare Worker secrets (names only)

Set via `wrangler secret put` on worker `cursorunofficialnews` (do not commit values):

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_1` … `STRIPE_PRICE_ID_5`
- `STRIPE_WEBHOOK_SECRET` (used by `/api/v1/stripe/webhook`)
- `N8N_NEWSLETTER_WEBHOOK_URL`
- `NEWSLETTER_FREE_EMAILS`
- `RESEND_FROM_EMAIL` (also appears as a `vars` entry in `wrangler.jsonc`; production should use a verified domain sender)

Related (not Stripe): `RESEND_API_KEY`, `TURNSTILE_SECRET`, `TURNSTILE_SITE_KEY`, `INGEST_SECRET`.

## D1 database

- **Name:** `cursorunofficialnews`
- **ID:** `ee7d7ffc-def5-4bc5-851b-d51a21610fec`
- **Membership-related tables (data retained on prod):** `bmc_members`, `memberships`, `membership_claim_requests`, `membership_access_overrides`, `membership_admin_audit`, `membership_refunds`

## Restore steps (high level)

1. Check out tag `membership-backup-2026-10-22` or copy files from this archive back into the repo at their original paths.
2. Re-wire the Worker in `web/worker/src/app.js`: `registerMembershipRoutes`, `POST /v1/stripe/webhook`, and newsletter entitlement checks in `web/worker/src/notifications/email-routes.js`.
3. Re-enable web routes in `web/src/App.jsx` (`/membership/unsubscribe`) and monetization sections on feed/newsletter pages.
4. Restore `web/package.json` test entries for `src/monetization/*.test.js` if removed.
5. Confirm D1 schema still matches `web/worker/src/db/schema.sql` (tables should already exist on prod).
6. Set Worker secrets listed above; confirm Stripe products/prices and webhook endpoint point at `https://cursorunofficial.news/api/v1/stripe/webhook`.
7. Re-import `docs/n8n/cursor-ai-news-newsletter.workflow.json` into n8n and set `N8N_NEWSLETTER_WEBHOOK_URL` on the Worker.
8. Deploy only after testing on `wrangler dev` + Vite preview — **do not** run D1 migrations that drop membership tables if you need historical member/refund rows.

## Build note

This directory is **not** imported by the app bundler. It is documentation + source snapshot only.
