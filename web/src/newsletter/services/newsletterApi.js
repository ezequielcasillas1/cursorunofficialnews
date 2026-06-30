import { API_BASE } from '../../config.js';

const REQUEST_TIMEOUT_MS = 15000;

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Newsletter API returned an unexpected response');
    }

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.error || `Request failed (${res.status})`);
    }

    return body;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Newsletter request timed out. Is the API running?');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function subscribeNewsletter({ email, categories, enabled = true }) {
  return fetchJson('/v1/email/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, categories, enabled }),
  });
}

export function unsubscribeNewsletter(token) {
  return fetchJson('/v1/email/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

export function fetchNewsletterStatus(token) {
  const params = new URLSearchParams({ token: String(token || '').trim() });
  return fetchJson(`/v1/email/status?${params.toString()}`);
}

export function verifyNewsletterSubscription(token) {
  return fetchJson('/v1/email/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}
