# LM Studio — Local LLM (8B–13B)

OpenAI-compatible API for local models via [LM Studio](https://lmstudio.ai/). Used by the news API for optional summarization and dev chat endpoints.

---

## 1. Start LM Studio

1. Download and open LM Studio.
2. Load an **8B–13B** model (e.g. Llama 3.1 8B, Mistral 7B, Qwen 2.5 14B).
3. **Local Server** tab → Start server (default `http://127.0.0.1:1234`).
4. Copy the **model identifier** shown in LM Studio (used for `LM_STUDIO_MODEL`).

---

## 2. API server env

```powershell
cd C:\Dev\CursorAINews\mobile\server
Copy-Item .env.example .env
# Edit .env — set LM_STUDIO_MODEL to your loaded model id
```

| Variable | Default | Notes |
|---|---|---|
| `LM_STUDIO_BASE_URL` | `http://127.0.0.1:1234/v1` | OpenAI-compatible base |
| `LM_STUDIO_MODEL` | *(unset)* | Required — model id from LM Studio |
| `LM_STUDIO_API_KEY` | `lm-studio` | LM Studio accepts any bearer token |
| `LM_STUDIO_TIMEOUT_MS` | `120000` | Local models can be slow on first token |

---

## 3. Verify connection

```powershell
cd C:\Dev\CursorAINews\mobile\server
npm run dev
# Another terminal:
node scripts/test-lm-studio.js
```

Or with the API running:

```powershell
curl http://127.0.0.1:8787/v1/llm/status
curl -X POST http://127.0.0.1:8787/v1/llm/summarize `
  -H "Content-Type: application/json" `
  -d '{"title":"Cursor 1.0","rawExcerpt":"Major release with new agent features."}'
```

`POST /v1/llm/chat` and `/v1/llm/summarize` follow the same auth as ingest (`INGEST_SECRET` when set).

---

## 4. Cursor IDE (models, not MCP)

LM Studio exposes an **OpenAI-compatible HTTP API**, not an MCP server for Cursor agents.

To use local models **inside Cursor**:

1. LM Studio local server running on `:1234`.
2. Cursor **Settings → Models** → enable OpenAI-compatible provider.
3. Base URL: `http://127.0.0.1:1234/v1` · API key: any placeholder (e.g. `lm-studio`).

Project MCP (`.cursor/mcp.json`) stays for **Pipedream** tooling — see [PIPEDREAM-MCP.md](PIPEDREAM-MCP.md). LM Studio’s own MCP feature is an **MCP host inside the LM Studio app**, separate from this repo.

---

## 5. Code layout

| Path | Role |
|---|---|
| `mobile/server/src/llm/config.js` | Env parsing |
| `mobile/server/src/llm/lm-studio-client.js` | Chat, models, summarize helper |
| `mobile/server/src/llm/llm-routes.js` | `/v1/llm/*` routes |
| `mobile/server/scripts/test-lm-studio.js` | CLI connectivity test |

Feed ingest does **not** auto-call LM Studio yet; use `summarizeNewsExcerpt()` or `/v1/llm/summarize` when wiring Phase 4+ enrichment.
