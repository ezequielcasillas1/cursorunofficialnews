import { API_BASE } from '../config.js';

const REQUEST_TIMEOUT_MS = import.meta.env.PROD ? 30000 : 15000;

export async function fetchVisitorStats() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/v1/public/visitor-stats`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return body;
  } finally {
    clearTimeout(timeoutId);
  }
}
