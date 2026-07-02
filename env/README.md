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

**Production:** Fly.io / Cloudflare / EAS secrets — not read from these files.
