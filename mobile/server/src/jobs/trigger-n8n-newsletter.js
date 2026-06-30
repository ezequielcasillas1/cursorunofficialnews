const DEFAULT_TIMEOUT_MS = 15_000;

export function isN8nNewsletterConfigured() {
  return Boolean(process.env.N8N_NEWSLETTER_WEBHOOK_URL?.trim());
}

export function getN8nNewsletterMode() {
  const mode = process.env.N8N_NEWSLETTER_MODE?.trim().toLowerCase() || 'parallel';
  if (mode === 'primary' || mode === 'parallel' || mode === 'off') return mode;
  return 'parallel';
}

export function shouldUseServerEmailDigest() {
  if (!isN8nNewsletterConfigured()) return true;
  return getN8nNewsletterMode() !== 'primary';
}

/**
 * Notify n8n to generate and send AI newsletter emails.
 * Fire-and-forget — failures are logged but do not block ingest.
 */
export async function triggerN8nNewsletter({ newItems, ingestAt } = {}) {
  const webhookUrl = process.env.N8N_NEWSLETTER_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { skipped: true, reason: 'N8N_NEWSLETTER_WEBHOOK_URL not configured' };
  }

  const apiBase =
    process.env.PUBLIC_API_BASE?.trim() ||
    `http://127.0.0.1:${process.env.PORT || 8787}`;

  const payload = {
    event: 'newsletter_digest',
    ingestAt: ingestAt || new Date().toISOString(),
    newItemCount: newItems?.length || 0,
    newItems: newItems || [],
    exportUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/export`,
    generateHtmlUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/generate-html`,
    summarizeUrl: `${apiBase.replace(/\/$/, '')}/v1/llm/summarize`,
    recentUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/recent`,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const secret = process.env.N8N_NEWSLETTER_WEBHOOK_SECRET?.trim();
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`n8n webhook returned ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
    }

    console.log(
      JSON.stringify({
        event: 'n8n_newsletter_triggered',
        newItems: payload.newItemCount,
        status: response.status,
      }),
    );

    return { triggered: true, status: response.status };
  } catch (error) {
    console.error('[n8n] Newsletter webhook failed:', error.message || error);
    return { triggered: false, error: error.message || String(error) };
  } finally {
    clearTimeout(timeoutId);
  }
}
