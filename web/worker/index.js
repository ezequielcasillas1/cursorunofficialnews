/**
 * Cloudflare Worker: proxy /api/* → Fly.io API, serve Vite static assets otherwise.
 * Lets the web app use API_BASE=/api in dev (Vite proxy) and production (this worker).
 */
const DEFAULT_API_ORIGIN = 'https://cursorunofficialnews.fly.dev';

function proxyApiRequest(request, apiOrigin) {
  const url = new URL(request.url);
  const apiPath = url.pathname.replace(/^\/api(?=\/|$)/, '') || '/';
  const target = new URL(`${apiPath}${url.search}`, apiOrigin);

  const headers = new Headers(request.headers);
  headers.delete('host');

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  return fetch(new Request(target, init));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const apiOrigin = env.API_ORIGIN?.trim() || DEFAULT_API_ORIGIN;
      return proxyApiRequest(request, apiOrigin);
    }

    // Serve ads.txt as plain text (never SPA fallback) for AdSense crawlers.
    if (url.pathname === '/ads.txt') {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.ok) {
        const headers = new Headers(assetResponse.headers);
        headers.set('Content-Type', 'text/plain; charset=utf-8');
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          headers,
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
