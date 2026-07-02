# Environment files

## OPEN THESE FILES (paste KEY=value here)

- `C:\Dev\CursorAINews\env\server\.env` — API server (Resend, ingest, LM Studio, …)
- `C:\Dev\CursorAINews\env\mobile\.env` — Expo / dev client (`EXPO_PUBLIC_*`)
- `C:\Dev\CursorAINews\env\web\.env` — Vite web (`VITE_*`)
- `C:\Dev\CursorAINews\env\api\.env` — Pipedream MCP OAuth

All four are gitignored. Never commit secrets.

## First-time setup

```powershell
Copy-Item C:\Dev\CursorAINews\env\server.example.env C:\Dev\CursorAINews\env\server\.env
Copy-Item C:\Dev\CursorAINews\env\mobile.example.env C:\Dev\CursorAINews\env\mobile\.env
Copy-Item C:\Dev\CursorAINews\env\web.example.env C:\Dev\CursorAINews\env\web\.env
Copy-Item C:\Dev\CursorAINews\env\api.example.env C:\Dev\CursorAINews\env\api\.env
```

## Templates (committed, no secrets)

| File | Purpose |
|------|---------|
| `env/server.example.env` | API server template |
| `env/mobile.example.env` | Expo template |
| `env/web.example.env` | Vite template |
| `env/api.example.env` | Pipedream template |

Loader: `env/load-env.js` (API, Expo, Vite).

**Production:** Cloudflare / EAS secrets — not read from these files.

## Local newsletter + n8n test

One webhook var only — no `N8N_NEWSLETTER_TARGET` or `_TEST`/`_PROD` suffix vars.

**`env/server/.env`**
```
N8N_NEWSLETTER_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook-test/cursor-newsletter
N8N_NEWSLETTER_MODE=parallel
DEV_BYPASS_MEMBERSHIP=true
MEMBERSHIP_DEV_EMAILS=you@example.com
PUBLIC_WEB_BASE=http://127.0.0.1:5173
PUBLIC_API_BASE=http://127.0.0.1:8787/api
```

**`env/web/.env`**
```
VITE_MEMBERSHIP_DEV_ACTIVE=true
VITE_MEMBERSHIP_DEV_EMAIL=you@example.com
```

Restart `npm run dev:api` and `npm run dev:web` after edits. Production: `npx wrangler secret put N8N_NEWSLETTER_WEBHOOK_URL` with your live `/webhook/` URL.
