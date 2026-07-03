# n8n — Cursor AI News Newsletter

Workflow export for **Cursor AI News Newsletter** (`AWUxJU3oVLNzP2Op` on n8n Cloud).

Canonical JSON: [`cursor-ai-news-newsletter.workflow.json`](./cursor-ai-news-newsletter.workflow.json)

## Required credentials (create in n8n UI first)

| Credential name | Type | Header name | Value source |
|---|---|---|---|
| **Cursor AI News Webhook Secret** | Header Auth | `X-Webhook-Secret` | Same as Cloudflare `N8N_NEWSLETTER_WEBHOOK_SECRET` |
| **Cursor AI News API Secret** | Header Auth | `X-API-Secret` | Same as Worker `INGEST_SECRET` / newsletter API secret |
| **Resend API** | Header Auth | `Authorization` | `Bearer <RESEND_API_KEY>` |

Do **not** commit secret values. Remove any inline `X-API-Secret` or `Authorization` headers from HTTP nodes after linking credentials.

## Import / update workflow

1. Create the three credentials above.
2. In n8n: **Workflows → Import from File** (or open existing workflow `AWUxJU3oVLNzP2Op`).
3. Re-link credentials on nodes if n8n prompts after import.
4. **Publish** the workflow (draft changes are not live until published).
5. Webhook URL: `https://<your-n8n-host>/webhook/cursor-newsletter` (prod) or `/webhook-test/cursor-newsletter` (test).

## API base URL

HTTP nodes call **`https://cursorunofficial.news/api/v1/...`** (Worker canonical base). If you use a separate API hostname, update both newsletter HTTP nodes consistently.

## Audit fixes in this export

- **Error handling:** `continueOnFail` + `onError: continueErrorOutput` on HTTP nodes; error branch → `Respond Webhook Error` (webhook runs only).
- **Webhook responses:** `Ingest Webhook1` uses `responseMode: responseNode`; `Respond Webhook Accepted` returns `202` immediately; failures on webhook path return `500` JSON.
- **Secrets:** HTTP nodes use `genericCredentialType` / `httpHeaderAuth` (no inline tokens).
- **typeVersions:** Webhook 2.1, Schedule 1.3, HTTP Request 4.4, Filter 2.3, Respond 1.5.
- **If node unary ops:** boolean `true`/`false` use `operator.singleValue: true` (no `rightValue`).

## n8n version (2.28.3 → 2.28.5)

This project uses **n8n Cloud** (`casiezeq.app.n8n.cloud`). There is no local `docker-compose` for n8n. Upgrade via n8n Cloud dashboard or wait for automatic host updates.

## Unused credential audit note

If the built-in audit reports “credential unused in 90 days,” it usually means **no workflow executions** in that window. **Cursor AI News Webhook Secret** is referenced by `Ingest Webhook1` — do not delete it. Re-run audit after the next successful execution.
