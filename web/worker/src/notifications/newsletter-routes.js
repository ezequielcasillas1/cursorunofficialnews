import { requireIngestSecret } from '../middleware/require-api-secret.js';
import {
  isN8nNewsletterConfigured,
  triggerN8nNewsletter,
} from '../jobs/trigger-n8n-newsletter.js';
import {
  generateNewsletterHtml,
  isCursorApiConfigured,
} from '../llm/cursor-api-client.js';
import { getNews } from '../store/news-store.js';
import { buildNewsletterExport } from './newsletter-export.js';

function parseRecentLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}

export function registerNewsletterRoutes(app) {
  app.get('/v1/newsletter/export', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const recentLimit = parseRecentLimit(c.req.query('recentLimit'));
    const includeNewItems = c.req.query('includeNewItems') === 'true';
    const body = includeNewItems ? await c.req.json().catch(() => ({})) : {};
    const newItems = includeNewItems && Array.isArray(body?.newItems) ? body.newItems : [];

    return c.json(await buildNewsletterExport(db, { newItems, recentLimit }, c.env));
  });

  app.post('/v1/newsletter/export', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const body = await c.req.json().catch(() => ({}));
    const recentLimit = parseRecentLimit(c.req.query('recentLimit') || body?.recentLimit);
    const newItems = Array.isArray(body?.newItems) ? body.newItems : [];

    return c.json(await buildNewsletterExport(db, { newItems, recentLimit }, c.env));
  });

  app.post('/v1/newsletter/trigger', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const body = await c.req.json().catch(() => ({}));
    const newItems = Array.isArray(body?.newItems) ? body.newItems : [];
    const ingestAt = body?.ingestAt || new Date().toISOString();

    try {
      const exportData = await buildNewsletterExport(db, { newItems }, c.env);

      if (isN8nNewsletterConfigured(c.env)) {
        c.executionCtx.waitUntil(
          triggerN8nNewsletter({ newItems, ingestAt }, c.env).catch((err) => {
            console.error('[POST /v1/newsletter/trigger] n8n background error:', err.message || err);
          }),
        );
      }

      return c.json(
        {
          ok: true,
          accepted: true,
          export: exportData,
          n8n: isN8nNewsletterConfigured(c.env)
            ? { status: 'pending', message: 'n8n webhook triggered in background' }
            : { skipped: true, reason: 'N8N_NEWSLETTER_WEBHOOK_URL not configured' },
        },
        202,
      );
    } catch (err) {
      console.error('[POST /v1/newsletter/trigger]', err);
      return c.json({ error: err.message || 'Newsletter trigger failed' }, 500);
    }
  });

  app.get('/v1/newsletter/recent', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const limit = parseRecentLimit(c.req.query('limit'));
    const category = c.req.query('category') ? String(c.req.query('category')) : undefined;
    return c.json(await getNews(db, { category, limit, offset: 0 }));
  });

  app.post('/v1/newsletter/generate-html', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');

    if (!isCursorApiConfigured(c.env)) {
      return c.json({ error: 'Cursor API not configured — set CURSOR_API_KEY' }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const { email, unsubscribeUrl, matchingNewItems, matchingRecentItems } = body || {};

    if (!email) {
      return c.json({ error: 'email is required' }, 400);
    }

    try {
      const result = await generateNewsletterHtml(
        {
          email,
          unsubscribeUrl,
          matchingNewItems: Array.isArray(matchingNewItems) ? matchingNewItems : [],
          matchingRecentItems: Array.isArray(matchingRecentItems) ? matchingRecentItems : [],
        },
        c.env,
      );
      return c.json({ ok: true, ...result });
    } catch (err) {
      console.error('[POST /v1/newsletter/generate-html]', err);
      return c.json({ error: err.message || 'Newsletter HTML generation failed' }, 502);
    }
  });
}
