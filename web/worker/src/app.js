import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { resolveCorsOrigin } from './security/cors-options.js';
import { registerCoreRoutes } from './routes/core-routes.js';
import { registerEmailRoutes } from './notifications/email-routes.js';
import { registerNewsletterRoutes } from './notifications/newsletter-routes.js';
import { registerMembershipRoutes } from './monetization/membership-routes.js';
import { registerLlmRoutes } from './llm/llm-routes.js';
import { handleStripeWebhook } from './monetization/stripe-webhook.js';

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

  // Raw-body webhook — register before any JSON body parsing assumptions.
  app.post('/v1/stripe/webhook', handleStripeWebhook);

  registerCoreRoutes(app);
  registerMembershipRoutes(app);
  registerEmailRoutes(app);
  registerNewsletterRoutes(app);
  registerLlmRoutes(app);

  return app;
}
