import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { resolveCorsOrigin } from './security/cors-options.js';
import { registerCoreRoutes } from './routes/core-routes.js';
import { registerEmailRoutes } from './notifications/email-routes.js';
import { registerNewsletterRoutes } from './notifications/newsletter-routes.js';
import { registerLlmRoutes } from './llm/llm-routes.js';
import { registerPublicStatsRoutes } from './routes/public-stats-routes.js';
import { isHealthPath, isSiteOffline, OFFLINE_MESSAGE } from './ops/site-offline.js';

/**
 * Builds the API Hono app under the `/api` base path, so the web frontend's
 * existing `/api/v1/...` calls (and the Worker's static-asset fallback for
 * everything else) keep working unchanged.
 */
export function createApp() {
  const app = new Hono().basePath('/api');

  app.use('*', async (c, next) => {
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    if (c.env.ENVIRONMENT === 'production') {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    await next();
  });

  app.use('*', async (c, next) => {
    const pathname = new URL(c.req.url).pathname;
    if (isSiteOffline(c.env) && !isHealthPath(pathname)) {
      c.header('Cache-Control', 'no-store');
      c.header('Retry-After', '3600');
      return c.text(OFFLINE_MESSAGE, 503);
    }
    await next();
  });

  app.use(
    '*',
    cors({
      origin: resolveCorsOrigin,
      allowMethods: ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-API-Secret'],
      maxAge: 600,
    }),
  );

  registerCoreRoutes(app);
  registerEmailRoutes(app);
  registerNewsletterRoutes(app);
  registerLlmRoutes(app);
  registerPublicStatsRoutes(app);

  return app;
}
