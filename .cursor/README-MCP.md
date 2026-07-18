# Cursor MCP - project config

| Server | URL / command | Auth |
|---|---|---|
| codescene | `cs-mcp` (local stdio) | `CS_ACCESS_TOKEN` from [codescene.io/users/me/pat](https://codescene.io/users/me/pat); set in Windows user env. Repo must be analyzed in CodeScene. **Restart Cursor** after editing `mcp.json`. |
| cloudflare-api / cloudflare-docs | `https://mcp.cloudflare.com/mcp`, `https://docs.mcp.cloudflare.com/mcp` | OAuth on first use in Cursor; **restart Cursor** after editing `mcp.json` |
| pipedream | `https://mcp.pipedream.net/v2` | Cursor prompts for **access_token** from [mcp.pipedream.com](https://mcp.pipedream.com) |
| n8n-mcp | `https://api.n8n-mcp.com/mcp` | Instance at [dashboard.n8n-mcp.com/instances](https://dashboard.n8n-mcp.com/dashboard/instances): `n8nApiUrl` (e.g. `https://casiezeq.app.n8n.cloud`) + API key from n8n **Settings → API** |
| emergent | `mcp-remote` → `https://mcp.emergent.sh/` | Native `url` OAuth fails (`redirect_uri must use https`); use `mcp-remote` on port **7890**. On Windows use full path `C:\\Program Files\\nodejs\\npx.cmd` (Cursor PATH often lacks `npx`). Reload Cursor, approve OAuth in browser. |

REST API OAuth (`PIPEDREAM_CLIENT_ID` / `SECRET`) lives in `env/api.local.env` - see [docs/PIPEDREAM-MCP.md](../docs/PIPEDREAM-MCP.md).

Do not commit secrets into `mcp.json`.

## After restart + Cloudflare OAuth

- **Worker:** set or confirm `API_ORIGIN` = `https://news-api.cursorunofficial.news` (MCP or dashboard) if CLI deploy did not run.
- **Zero Trust:** verify tunnel route `news` and public hostname for `news-api.cursorunofficial.news` (502 on `/health` = tunnel or upstream down).
- **DNS:** `cursorunofficial.news` → Worker; `news-api` → tunnel hostname.
- **CLI deploy:** run `wrangler login` or set `CLOUDFLARE_API_TOKEN`, then `npm run deploy:web` from repo root.
