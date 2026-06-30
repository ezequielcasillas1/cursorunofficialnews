import { requireIngestSecret } from '../middleware/require-api-secret.js';
import { triggerN8nNewsletter } from '../jobs/trigger-n8n-newsletter.js';
import {
  generateNewsletterHtml,
  isCursorApiConfigured,
} from '../llm/cursor-api-client.js';
import { getNews } from '../store/memory-cache.js';
import { buildNewsletterExport } from './newsletter-export.js';

function parseRecentLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}

export function registerNewsletterRoutes(app) {
  app.get('/v1/newsletter/export', requireIngestSecret, (req, res) => {
    res.set('Cache-Control', 'no-store');
    const recentLimit = parseRecentLimit(req.query.recentLimit);
    const includeNewItems = req.query.includeNewItems === 'true';
    const newItems = includeNewItems && Array.isArray(req.body?.newItems) ? req.body.newItems : [];

    res.json(buildNewsletterExport({ newItems, recentLimit }));
  });

  app.post('/v1/newsletter/export', requireIngestSecret, (req, res) => {
    res.set('Cache-Control', 'no-store');
    const recentLimit = parseRecentLimit(req.query.recentLimit || req.body?.recentLimit);
    const newItems = Array.isArray(req.body?.newItems) ? req.body.newItems : [];

    res.json(buildNewsletterExport({ newItems, recentLimit }));
  });

  app.post('/v1/newsletter/trigger', requireIngestSecret, async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const newItems = Array.isArray(req.body?.newItems) ? req.body.newItems : [];
    const ingestAt = req.body?.ingestAt || new Date().toISOString();

    const [exportData, n8nResult] = await Promise.all([
      Promise.resolve(buildNewsletterExport({ newItems })),
      triggerN8nNewsletter({ newItems, ingestAt }),
    ]);

    res.json({
      ok: true,
      export: exportData,
      n8n: n8nResult,
    });
  });

  app.get('/v1/newsletter/recent', requireIngestSecret, (req, res) => {
    res.set('Cache-Control', 'no-store');
    const limit = parseRecentLimit(req.query.limit);
    const category = req.query.category ? String(req.query.category) : undefined;
    res.json(getNews({ category, limit, offset: 0 }));
  });

  app.post('/v1/newsletter/generate-html', requireIngestSecret, async (req, res) => {
    res.set('Cache-Control', 'no-store');

    if (!isCursorApiConfigured()) {
      res.status(503).json({ error: 'Cursor API not configured — set CURSOR_API_KEY' });
      return;
    }

    const {
      email,
      unsubscribeUrl,
      matchingNewItems,
      matchingRecentItems,
    } = req.body || {};

    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    try {
      const result = await generateNewsletterHtml({
        email,
        unsubscribeUrl,
        matchingNewItems: Array.isArray(matchingNewItems) ? matchingNewItems : [],
        matchingRecentItems: Array.isArray(matchingRecentItems) ? matchingRecentItems : [],
      });
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('[POST /v1/newsletter/generate-html]', err);
      res.status(502).json({ error: err.message || 'Newsletter HTML generation failed' });
    }
  });
}
