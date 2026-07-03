import { API_BASE } from '../config.js';

const REQUEST_TIMEOUT_MS = import.meta.env.PROD ? 30000 : 15000;

async function fetchPresenceJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out — is the API running at ${API_BASE}?`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fetchOnlineCount() {
  return fetchPresenceJson('/v1/views');
}

export function sendPresenceHeartbeat() {
  return fetchPresenceJson('/v1/views', { method: 'POST' });
}
