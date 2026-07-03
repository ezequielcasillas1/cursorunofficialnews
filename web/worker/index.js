import { createApp } from './src/app.js';
import { bootstrapIngestIfEmpty, runIngestWithLock } from './src/ingest/run-ingest.js';
import { runScheduledDigest } from './src/jobs/run-scheduled-digest.js';

/** @param {string} pathname */
function resolveExplicitAssetContentType(pathname) {
  const exact = {
    '/ads.txt': 'text/plain; charset=utf-8',
    '/robots.txt': 'text/plain; charset=utf-8',
    '/sitemap.xml': 'application/xml; charset=utf-8',
    '/favicon.ico': 'image/x-icon',
    '/site.webmanifest': 'application/manifest+json',
  };
  if (exact[pathname]) return exact[pathname];

  if (!pathname.startsWith('/brand/')) return null;

  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  if (pathname.endsWith('.webmanifest')) return 'application/manifest+json';
  return null;
}

const apiApp = createApp();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Unprefixed convenience alias for uptime monitors / Cloudflare health
    // checks (the full API also answers at /api/health).
    if (url.pathname === '/health') {
      return Response.json({ ok: true });
    }

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const response = await apiApp.fetch(request, env, ctx);
      // Best-effort cache seed on a cold D1 database — cheap no-op (a single
      // COUNT query) once news_items has rows. There is no server "boot"
      // event in Workers, so this replaces the old bootstrapIngestIfEmpty()
      // call in the Express app.listen() callback.
      ctx.waitUntil(bootstrapIngestIfEmpty(env.DB, env).catch(() => {}));
      return response;
    }

    // Static files that must never hit SPA fallback — explicit Content-Type.
    const explicitContentType = resolveExplicitAssetContentType(url.pathname);
    if (explicitContentType) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.ok) {
        const headers = new Headers(assetResponse.headers);
        headers.set('Content-Type', explicitContentType);
        return new Response(assetResponse.body, {
          status: assetResponse.status,
          headers,
        });
      }
    }

    return env.ASSETS.fetch(request);
  },

  /** Cron Trigger — ingest every 30 min; digest batch at top of each hour (CT windows). */
  async scheduled(controller, env, ctx) {
    const cron = controller.cron;

    if (cron === '*/30 * * * *') {
      ctx.waitUntil(
        runIngestWithLock(env.DB, env)
          .then((result) => {
            console.log(
              JSON.stringify({
                event: 'ingest_cron',
                cron,
                ...result,
              }),
            );
          })
          .catch((err) => {
            console.error('[cron] ingest', err.message || err);
          }),
      );
      return;
    }

    ctx.waitUntil(
      runScheduledDigest(env.DB, env)
        .then((result) => {
          console.log(
            JSON.stringify({
              event: 'digest_cron',
              cron,
              ...result,
            }),
          );
        })
        .catch((err) => {
          console.error('[cron] digest', err.message || err);
        }),
    );
  },
};
