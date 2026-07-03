# Security hardening (Cursor AI News)

In-repo Worker limits blunt abuse bursts; add **Cloudflare dashboard** rules for cross-isolate protection.

## Required production secrets (website)

| Secret | Purpose |
|---|---|
| `INGEST_SECRET` | `POST /api/v1/ingest`, newsletter admin, LLM |

```powershell
npx wrangler secret put INGEST_SECRET
```

## Optional: mobile push registration

| Secret | Purpose |
|---|---|
| `REGISTER_SECRET` | `POST/DELETE /api/v1/devices/register` (push tokens) |

**Website-only deploy:** skip `REGISTER_SECRET` — push registration returns 503; news, membership, email, and Stripe are unaffected.

When enabling mobile later:

1. Generate a strong random secret.
2. Set on Worker: `npx wrangler secret put REGISTER_SECRET`
3. Bake into the app at build time (not committed):

```powershell
# mobile/.env or EAS secret
EXPO_PUBLIC_REGISTER_SECRET=<same-as-REGISTER_SECRET>
```

**EAS:** Project → Secrets → add `EXPO_PUBLIC_REGISTER_SECRET`, then rebuild (`eas build`). Dev client builds without this still work locally when Worker has no `REGISTER_SECRET`.

## Cloudflare Rate Limiting (dashboard)

**Security → WAF → Rate limiting rules** (or equivalent on your plan). Target hostname `cursorunofficial.news`, path prefix `/api/`.

| Rule name | Match | Threshold | Action |
|---|---|---|---|
| Device register | `POST` `/api/v1/devices/register` | 10 req / 1 min / IP | Block 10 min |
| Membership checkout | `POST` `/api/v1/membership/checkout` | 10 req / 1 min / IP | Block 10 min |
| Membership claim | `POST` `/api/v1/membership/claim` | 10 req / 1 min / IP | Block 10 min |
| Email subscribe | `POST` `/api/v1/email/subscribe` | 10 req / 1 min / IP | Block 10 min |
| Email unsubscribe | `POST` `/api/v1/email/unsubscribe` | 20 req / 1 min / IP | Block 10 min |

Do **not** rate-limit `GET /api/v1/news` or `POST /api/v1/stripe/webhook`.

Not configurable via `wrangler.jsonc` in this repo — create rules in the Cloudflare dashboard.

## npm audit (2026-07-02)

| Package | Result |
|---|---|
| `web/` | 0 vulnerabilities |
| `mobile/` | 22 (Expo 52 transitive: xmldom, tar, ajv, postcss, uuid) — fix requires Expo SDK 57+ upgrade |
| repo root | 10 moderate (Expo CLI transitive uuid) — same upgrade path |

Do not run `npm audit fix --force` without planning an Expo major upgrade.

## Optional / future

- **Turnstile** on membership checkout or claim — needs site key + server verify; not wired yet.
- **NEWSLETTER_FREE_EMAILS** — production bypass whitelist; keep minimal; Worker logs a one-time warning when set.

## Related

- [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) — deploy + all secrets
- [RUN-LOCAL.md](RUN-LOCAL.md) — local env
