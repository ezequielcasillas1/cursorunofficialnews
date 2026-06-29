# Pipedream MCP — Developer Setup

Use **REST API OAuth credentials** (workspace → **API settings** → **New OAuth Client**). These are **not** the same as Connect CLI credentials from `pd oauth-client create --profile connect`.

| Credential type | Used for | Token endpoint |
|---|---|---|
| **REST API OAuth** (`PIPEDREAM_CLIENT_ID` / `SECRET`) | Connect API, MCP developer server, server-side tooling | `POST https://api.pipedream.com/v1/oauth/token` |
| Connect managed-auth OAuth | End-user account linking in your app UI | Connect-specific flows — not for MCP token exchange |
| `pd login` user session | CLI only | Not valid for `client_credentials` |

**Project:** `proj_mJsxa0P` · **Org:** `o_pNI7KjZ`

---

## 1. Local env (no secrets in repo)

```powershell
cd C:\Dev\CursorAINews\api
Copy-Item .env.example .env.local
# Edit .env.local — set PIPEDREAM_CLIENT_ID and PIPEDREAM_CLIENT_SECRET from dashboard
```

Never commit `api/.env.local` or credential export files.

---

## 2. Test token exchange (Phase A)

Load env from `.env.local`, then exchange credentials for a bearer token:

```powershell
cd C:\Dev\CursorAINews\api

# Load .env.local into current session (PowerShell)
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
  }
}

$body = @{
  grant_type    = 'client_credentials'
  client_id     = $env:PIPEDREAM_CLIENT_ID
  client_secret = $env:PIPEDREAM_CLIENT_SECRET
} | ConvertTo-Json

$response = Invoke-RestMethod -Method POST `
  -Uri 'https://api.pipedream.com/v1/oauth/token' `
  -ContentType 'application/json' `
  -Body $body

$response | Select-Object token_type, expires_in, @{ n = 'access_token_preview'; e = { $_.access_token.Substring(0, [Math]::Min(20, $_.access_token.Length)) + '...' } }
```

**Success:** `token_type` = `Bearer`, `expires_in` = `3600`, non-empty `access_token`.

**Failure:** `401 invalid_client` → wrong ID/secret pair or wrong client type (use REST API OAuth, not Connect CLI export).

Or run the helper script:

```powershell
cd C:\Dev\CursorAINews\api
.\scripts\test-oauth-token.ps1
```

---

## 3. Verify Connect API access (Phase B)

With a valid access token:

```powershell
$token = $response.access_token
$projectId = $env:PIPEDREAM_PROJECT_ID  # proj_mJsxa0P

Invoke-RestMethod `
  -Uri "https://api.pipedream.com/v1/connect/$projectId/accounts" `
  -Headers @{ Authorization = "Bearer $token" }
```

Empty list is OK — confirms auth + project scope.

---

## 4. Cursor MCP config (Phase C)

Two MCP endpoints exist:

| Endpoint | Auth | Use case |
|---|---|---|
| `https://mcp.pipedream.net/v2` | Short-lived **access_token** from [mcp.pipedream.com](https://mcp.pipedream.com) (pick apps → copy token) | Quick Cursor chat / ad-hoc tool use |
| `https://remote.mcp.pipedream.net` | **REST API OAuth** + project env vars | Developer agents embedding 3,000+ app tools |

**Project config** (`.cursor/mcp.json`) uses the quick-chat URL:

```json
{
  "mcpServers": {
    "pipedream": {
      "url": "https://mcp.pipedream.net/v2"
    }
  }
}
```

When Cursor prompts for **access_token**, paste the token from [mcp.pipedream.com](https://mcp.pipedream.com) — do **not** paste the OAuth client secret.

For **developer MCP** (`remote.mcp.pipedream.net`), env vars are required server-side per [mcp.pipedream.com/developers](https://mcp.pipedream.com/developers):

- `PIPEDREAM_CLIENT_ID`
- `PIPEDREAM_CLIENT_SECRET`
- `PIPEDREAM_PROJECT_ID`
- `PIPEDREAM_PROJECT_ENVIRONMENT` (`development` or `production`)

Do **not** put client secrets in committed `mcp.json`. Keep them in `api/.env.local` or user-level Cursor env.

After editing MCP config: **restart Cursor** → **Settings → MCP** → enable **pipedream**.

---

## 5. CLI reference (optional)

```powershell
$env:Path += ";$env:LOCALAPPDATA\pipedream-cli"
pd login
pd init connect   # requires REST API OAuth workspace access
```

If `pd init connect` returns **Unauthorized**, use dashboard-created REST API OAuth instead of Connect CLI exports.

---

## Related

- [BMC go-live](BMC-GO-LIVE.md) — membership webhooks (Fly.io; separate from Pipedream)
- [AGENT-CONTEXT.md](AGENT-CONTEXT.md) — product phase plan (Phase 4+)
