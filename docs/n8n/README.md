# n8n — Cursor AI News Newsletter

Workflow export for **Cursor AI News Newsletter** (`AWUxJU3oVLNzP2Op` on n8n Cloud).

Canonical JSON: [`cursor-ai-news-newsletter.workflow.json`](./cursor-ai-news-newsletter.workflow.json)

## Digest schedule (Worker vs n8n)

| Source | Schedule | Notes |
|---|---|---|
| **Cloudflare Worker** | **1:00 PM America/Chicago** (`DIGEST_HOURS=13`) | Hourly cron; sends only when local hour is 13. Queues items between sends. |
| **n8n `Daily 9am ET (DISABLED — use Worker 1pm CT digest)`** | ~~9:00 AM ET (`0 9 * * *`)~~ **disabled in export** | Was a separate daily blast independent of Worker. Disabled to avoid duplicate sends and n8n credit use. |

After importing this workflow, confirm **Daily 9am ET (DISABLED — use Worker 1pm CT digest)** stays disabled in the n8n UI (toggle off or delete the node). The **Ingest Webhook** path still runs when the Worker POSTs on ingest (if webhook URL is set).

### Manual test runs in n8n UI

Do **not** use "Execute from node" on mid-pipeline nodes after a rename — n8n caches the old node name and fails with `Could not find a node named "…"`. Instead:

1. Use **Test workflow** from the canvas toolbar (webhook test URL), or
2. POST to the webhook from the Worker/curl with `X-Webhook-Secret`.

"Execute workflow" with only the webhook trigger disabled and schedule disabled will fail with `No node to start the workflow from could be found` — that is expected.

### Saving n8n credits on scheduled digests

Worker `N8N_NEWSLETTER_MODE=parallel` (default) still POSTs to the n8n webhook when the **1pm scheduled digest** runs, in addition to server-side Resend sends. To use Worker/Resend only for scheduled digests:

- Remove or unset `N8N_NEWSLETTER_WEBHOOK_URL` on the Worker, **or**
- Keep webhook for manual/testing but accept parallel n8n runs on each digest.

(`N8N_NEWSLETTER_MODE=off` is defined but does not yet skip the webhook trigger — use webhook URL removal for server-only sends.)

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

- **Digest sections:** Per-subscriber `digestSections` from `/v1/newsletter/export` (topic-grouped, 1–3 headlines per enabled category) are passed to `/v1/newsletter/generate-html`. Flat `matchingNewItems` / `matchingRecentItems` are fallback only when sections are empty. Email subject comes from the generate-html response (`assembleEmailSubject`), not a hardcoded string.
- **Error handling:** `onError: continueErrorOutput` on HTTP nodes (no deprecated `continueOnFail`); error output on `main[1]` → `If Webhook Error Response` → `Respond Webhook Error` (webhook runs only).
- **Webhook responses:** `Ingest Webhook` uses `responseMode: responseNode`; `Respond Webhook Accepted` returns `202` immediately; failures on webhook path return `500` JSON.
- **Secrets:** HTTP nodes use `genericCredentialType` / `httpHeaderAuth` (no inline tokens).
- **typeVersions:** Webhook 2.1, Schedule 1.3, HTTP Request 4.4, Filter 2.3, Respond 1.5.
- **If node unary ops:** boolean `true`/`false` use `operator.singleValue: true` (no `rightValue`).

## n8n version (2.28.3 → 2.28.5)

This project uses **n8n Cloud** (`casiezeq.app.n8n.cloud`). There is no local `docker-compose` for n8n. Upgrade via n8n Cloud dashboard or wait for automatic host updates.

## Unused credential audit note

If the built-in audit reports “credential unused in 90 days,” it usually means **no workflow executions** in that window. **Cursor AI News Webhook Secret** is referenced by `Ingest Webhook` — do not delete it. Re-run audit after the next successful execution.
