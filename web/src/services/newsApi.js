import { API_BASE, INGEST_SECRET } from '../config.js';

/** Fly cold starts can exceed 10s when min_machines_running = 0. */
const REQUEST_TIMEOUT_MS = import.meta.env.PROD ? 30000 : 15000;

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

    if (!res.ok) {
      if (contentType.includes('application/json')) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      throw new Error(`Request failed (${res.status})`);
    }

    if (!contentType.includes('application/json')) {
      const preview = (await res.text()).slice(0, 80).trim();
      if (preview.toLowerCase().startsWith('<!doctype') || preview.startsWith('<html')) {
        throw new Error(
          `API returned HTML instead of JSON at ${API_BASE}${path} — is the API deployed? See docs/CLOUDFLARE-DEPLOY.md`,
        );
      }
      throw new Error(`Expected JSON from API but received ${contentType || 'unknown content type'}`);
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
