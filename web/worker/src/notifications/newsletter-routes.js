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
import {
  buildSubscriberForClient,
  getSubscriber,
  isSubscriberVerified,
  normalizeEmail,
} from '../store/email-subscribers.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from './resend-client.js';
import { buildNewsletterExport, buildSubscriberDigest } from './newsletter-export.js';

function parseRecentLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 20;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}

async function handleBuildDigest(c, body = {}) {
  const db = c.env.DB;
  const email = normalizeEmail(body?.email || c.req.query('email'));
  if (!email) {
    return c.json({ error: 'email is required' }, 400);
  }

  const subscriber = await getSubscriber(db, email);
  if (!subscriber?.enabled || !isSubscriberVerified(subscriber)) {
    return c.json({ error: 'Verified subscriber not found for that email' }, 404);
  }

  const newItems = Array.isArray(body?.newItems) ? body.newItems : [];
  const preferNewItems = body?.preferNewItems !== false;
  const digest = await buildSubscriberDigest(
    db,
    subscriber,
    { newItems, preferNewItems },
    c.env,
  );

  if (!digest.itemCount) {
    return c.json({
      ok: true,
      empty: true,
      email,
      subscriber: buildSubscriberForClient(subscriber),
      sections: [],
      dividerCount: 0,
    });
  }

  let sendResult;
  if (body?.send === true) {
    if (!isResendConfigured(c.env)) {
      return c.json({ error: 'RESEND_API_KEY not configured' }, 503);
    }
    const resend = getResendClient(c.env);
    const from = getTransactionalFromAddress(c.env);
    const { error } = await resend.emails.send({
      from,
      to: [email],
      subject: digest.subject,
      html: digest.html,
      text: digest.text,
    });
    if (error) {
      return c.json({ error: error.message || 'Test send failed' }, 502);
    }
    sendResult = { sent: true };
  }

  return c.json({
    ok: true,
    email,
    subscriber: buildSubscriberForClient(subscriber),
    sections: digest.sections,
    itemCount: digest.itemCount,
    dividerCount: digest.dividerCount,
    subject: digest.subject,
    html: digest.html,
    text: digest.text,
    send: sendResult || { sent: false },
  });
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

  app.get('/v1/newsletter/build-digest', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    return handleBuildDigest(c, { email: c.req.query('email'), send: c.req.query('send') === 'true' });
  });

  app.post('/v1/newsletter/build-digest', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    const body = await c.req.json().catch(() => ({}));
    return handleBuildDigest(c, body);
  });

  /** Alias for n8n manual test runs (same handler as build-digest). */
  app.post('/v1/newsletter/test', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');
    const body = await c.req.json().catch(() => ({}));
    return handleBuildDigest(c, body);
  });

  app.post('/v1/newsletter/generate-html', requireIngestSecret, async (c) => {
    c.header('Cache-Control', 'no-store');

    if (!isCursorApiConfigured(c.env)) {
      return c.json({ error: 'Cursor API not configured — set CURSOR_API_KEY' }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const {
      email,
      unsubscribeUrl,
      matchingNewItems,
      matchingRecentItems,
      digestSections,
      officialOnly,
      subscriber,
    } = body || {};

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
          digestSections: Array.isArray(digestSections) ? digestSections : [],
          officialOnly: Boolean(officialOnly),
          subscriber: subscriber && typeof subscriber === 'object' ? subscriber : undefined,
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
