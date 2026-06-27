import { API_BASE } from '../config/constants';

async function fetchJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
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

export function triggerIngest() {
  return fetchJson('/v1/ingest', { method: 'POST' });
}
