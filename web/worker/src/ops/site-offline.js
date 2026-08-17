/** Reversible public-site kill switch. Production only — skipped when ENVIRONMENT=development. */

export const OFFLINE_MESSAGE = 'Site temporarily unavailable';

const TRUTHY = new Set(['true', '1', 'yes', 'on']);

/** @param {Record<string, unknown> | undefined} env */
export function isSiteOffline(env) {
  if (!env) return false;
  if (env.ENVIRONMENT === 'development') return false;
  const flag = String(env.SITE_OFFLINE ?? '').trim().toLowerCase();
  return TRUTHY.has(flag);
}

/** @param {string} pathname */
export function isHealthPath(pathname) {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  return path === '/health' || path === '/api/health';
}

/** @param {Record<string, unknown> | undefined} env */
export function healthPayload(env) {
  return { ok: true, offline: isSiteOffline(env) };
}

const OFFLINE_HEADERS = {
  'Cache-Control': 'no-store',
  'Retry-After': '3600',
};

/** @param {Request} [request] */
export function offlineResponse(request) {
  const accept = request?.headers?.get?.('Accept') || '';
  const wantsHtml = accept.includes('text/html');
  if (wantsHtml) {
    return new Response(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Unavailable</title></head><body><p>${OFFLINE_MESSAGE}</p></body></html>`,
      {
        status: 503,
        headers: { ...OFFLINE_HEADERS, 'Content-Type': 'text/html; charset=utf-8' },
      },
    );
  }
  return new Response(OFFLINE_MESSAGE, {
    status: 503,
    headers: { ...OFFLINE_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
