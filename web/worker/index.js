import { createApp } from './src/app.js';
import { bootstrapIngestIfEmpty, runIngestWithLock } from './src/ingest/run-ingest.js';
import { runScheduledDigest } from './src/jobs/run-scheduled-digest.js';
import { runVisitorAnalyticsSnapshot } from './src/jobs/snapshot-visitor-analytics.js';
import { healthPayload, isHealthPath, isSiteOffline, offlineResponse } from './src/ops/site-offline.js';
import { getNewsItem } from './src/store/news-store.js';
import { sitemapResponse } from './src/seo/sitemap.js';
import { isKnownSpaPath, parseItemIdFromPath } from './src/seo/spa-routing.js';

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

async function notFoundResponse(env) {
  const response = await env.ASSETS.fetch(new Request(new URL('/404.html', 'https://cursorunofficial.news')));
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: 404, headers });
}

async function resolveSpaAsset(request, env, db) {
  const url = new URL(request.url);
  const itemId = parseItemIdFromPath(url.pathname);
  if (itemId) {
    const item = await getNewsItem(db, itemId);
    if (!item) {
      return notFoundResponse(env);
    }
  } else if (!isKnownSpaPath(url.pathname)) {
    return notFoundResponse(env);
  }

  return env.ASSETS.fetch(request);
}

const apiApp = createApp();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (isHealthPath(url.pathname)) {
      return Response.json(healthPayload(env));
    }

    if (isSiteOffline(env)) {
      return offlineResponse(request);
    }

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const response = await apiApp.fetch(request, env, ctx);
      ctx.waitUntil(bootstrapIngestIfEmpty(env.DB, env).catch(() => {}));
      return response;
    }

    if (url.pathname === '/sitemap.xml') {
      return sitemapResponse(env.DB, env);
    }

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

    return resolveSpaAsset(request, env, env.DB);
  },

  async scheduled(controller, env, ctx) {
    if (isSiteOffline(env)) {
      console.log(JSON.stringify({ event: 'cron_skipped', reason: 'site_offline', cron: controller.cron }));
      return;
    }

    const cron = controller.cron;

    if (cron === '15 6 * * *') {
      ctx.waitUntil(
        runVisitorAnalyticsSnapshot(env.DB, env)
          .then((result) => {
            console.log(JSON.stringify({ event: 'visitor_analytics_snapshot', cron, ...result }));
          })
          .catch((err) => {
            console.error('[cron] visitor_analytics_snapshot', err.message || err);
          }),
      );
      return;
    }

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
