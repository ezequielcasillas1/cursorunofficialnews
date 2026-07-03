const DEFAULT_TIMEOUT_MS = 8_000;

function getN8nTimeoutMs(env) {
  const ms = Number(env?.N8N_NEWSLETTER_TIMEOUT_MS);
  return Number.isFinite(ms) && ms > 0 ? ms : DEFAULT_TIMEOUT_MS;
}

export function isN8nNewsletterConfigured(env) {
  return Boolean(env?.N8N_NEWSLETTER_WEBHOOK_URL?.trim());
}

export function getN8nNewsletterMode(env) {
  const mode = env?.N8N_NEWSLETTER_MODE?.trim().toLowerCase() || 'parallel';
  if (mode === 'primary' || mode === 'parallel' || mode === 'off') return mode;
  return 'parallel';
}

export function shouldUseServerEmailDigest(env) {
  if (!isN8nNewsletterConfigured(env)) return true;
  return getN8nNewsletterMode(env) !== 'primary';
}

/**
 * Notify n8n to generate and send AI newsletter emails.
 * Fire-and-forget — failures are logged but do not block ingest.
 */
export async function triggerN8nNewsletter({ newItems, ingestAt } = {}, env) {
  if (!newItems?.length) {
    return { skipped: true, reason: 'no_new_items' };
  }

  const webhookUrl = env?.N8N_NEWSLETTER_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return { skipped: true, reason: 'N8N_NEWSLETTER_WEBHOOK_URL not configured' };
  }

  const apiBase = env?.PUBLIC_API_BASE?.trim() || 'https://cursorunofficial.news/api';

  const payload = {
    event: 'newsletter_digest',
    ingestAt: ingestAt || new Date().toISOString(),
    newItemCount: newItems?.length || 0,
    newItems: newItems || [],
    exportUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/export`,
    buildDigestUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/build-digest`,
    testDigestUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/test`,
    generateHtmlUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/generate-html`,
    summarizeUrl: `${apiBase.replace(/\/$/, '')}/v1/llm/summarize`,
    recentUrl: `${apiBase.replace(/\/$/, '')}/v1/newsletter/recent`,
  };

  const timeoutMs = getN8nTimeoutMs(env);

  try {
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const secret = env?.N8N_NEWSLETTER_WEBHOOK_SECRET?.trim();
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
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
    const message =
      error?.name === 'TimeoutError' || error?.name === 'AbortError'
        ? `n8n webhook timed out after ${timeoutMs}ms`
        : error.message || String(error);
    console.error('[n8n] Newsletter webhook failed:', message);
    return { triggered: false, error: message };
  }
}

