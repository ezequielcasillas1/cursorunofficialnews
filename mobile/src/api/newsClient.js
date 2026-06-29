import { API_BASE } from '../config/constants';

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

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }

    return res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s — check API at ${API_BASE}`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function fetchNews({ category, official, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (official) params.set('official', 'true');
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return fetchJson(`/v1/news${qs ? `?${qs}` : ''}`);
}

export function fetchSources() {
  return fetchJson('/v1/sources');
}

export function buildSourceMap(sources = []) {
  return Object.fromEntries(sources.map((s) => [s.id, s]));
}

export function fetchStatus() {
  return fetchJson('/v1/status');
}

export function registerDevice({ token, platform, categories, enabled }) {
  return fetchJson('/v1/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, platform, categories, enabled }),
  });
}

export function unregisterDevice(token) {
  return fetchJson('/v1/devices/register', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}
