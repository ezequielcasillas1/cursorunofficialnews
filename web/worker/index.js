import { createApp } from './src/app.js';
import { bootstrapIngestIfEmpty, runIngestWithLock } from './src/ingest/run-ingest.js';

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

  /** Cron Trigger — replaces node-cron's 30-min INGEST_CRON_SCHEDULE. */
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(
      runIngestWithLock(env.DB, env)
        .then((result) => {
          console.log(
            JSON.stringify({
              event: 'ingest_cron',
              cron: controller.cron,
              ...result,
            }),
          );
        })
        .catch((err) => {
          console.error('[cron]', err.message || err);
        }),
    );
  },
};
