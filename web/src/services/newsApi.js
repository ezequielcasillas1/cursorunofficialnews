import { API_BASE, INGEST_SECRET } from '../config.js';

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
        `Request timed out — is the API running at ${API_BASE}?`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function ingestHeaders() {
  if (!INGEST_SECRET) return {};
  return { 'X-API-Secret': INGEST_SECRET };
}

export function fetchNews({ category, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return fetchJson(`/v1/news${qs ? `?${qs}` : ''}`);
}

export function fetchSources() {
  return fetchJson('/v1/sources');
}

export function fetchStatus() {
  return fetchJson('/v1/status');
}

export function triggerIngest() {
  return fetchJson('/v1/ingest', {
    method: 'POST',
    headers: ingestHeaders(),
  });
}

export function buildSourceMap(sources = []) {
  return Object.fromEntries(sources.map((s) => [s.id, s]));
}
