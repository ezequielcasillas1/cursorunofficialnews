import cors from 'cors';
import cron from 'node-cron';
import express from 'express';
import { ingestAllSources } from './ingest/feeds.js';
import { isScrapeConfigured } from './ingest/scrape.js';
import { isTwitterApiConfigured } from './ingest/twitter-api.js';
import { diffNewItems } from './jobs/diff-new-items.js';
import { notifyEmailSubscribers } from './jobs/send-email-digest.js';
import { notifySubscribers } from './jobs/send-push.js';
import {
  optionalRegisterSecret,
  requireIngestSecret,
} from './middleware/require-api-secret.js';
import { listSourcesForApi } from './sources/registry.js';
import {
  getLastIngestAt,
  getNews,
  getStatus,
  replaceItems,
  setLastIngestAt,
} from './store/memory-cache.js';
import {
  getSubscriber,
  isValidEmail,
  listSubscribers,
  subscribeEmail,
  unsubscribeByToken,
  unsubscribeEmail,
} from './store/email-subscribers.js';
import {
  listDevices,
  registerDevice,
  unregisterDevice,
} from './store/device-tokens.js';
import { handleBmcWebhook } from './monetization/bmc-webhook.js';
import { registerMembershipRoutes } from './monetization/membership-routes.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());

app.post(
  '/v1/bmc/webhook',
  express.raw({ type: 'application/json' }),
  handleBmcWebhook,
);

app.use(express.json());
registerMembershipRoutes(app);

/** In-process mutex — prevents concurrent ingests from double-notifying. */
let ingestLock = Promise.resolve();

async function withIngestLock(fn) {
  const prev = ingestLock;
  let release;
  ingestLock = new Promise((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    return await fn();
  } finally {
    release();
  }
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/v1/status', (_req, res) => {
  res.json({
    ...getStatus(),
    sourceCount: listSourcesForApi().filter((s) => s.enabled).length,
    scrapeConfigured: isScrapeConfigured(),
    twitterApiConfigured: isTwitterApiConfigured(),
  });
});

app.get('/v1/sources', (_req, res) => {
  res.json({ sources: listSourcesForApi() });
});

app.get('/v1/news', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const category = req.query.category ? String(req.query.category) : undefined;
  const official = req.query.official === 'true';
  res.json({
    items: getNews({
      category,
      official,
      limit: Number.isFinite(limit) ? limit : 50,
    }),
    lastIngestAt: getLastIngestAt(),
  });
});

async function applyIngestResult(items) {
  return withIngestLock(async () => {
    if (items.length === 0) {
      console.warn('[ingest] No items returned — keeping existing cache');
      return { lastIngestAt: getLastIngestAt(), newCount: 0 };
    }
    const newItems = diffNewItems(items);
    replaceItems(items);
    const ingestedAt = new Date().toISOString();
    setLastIngestAt(ingestedAt);
    if (newItems.length > 0) {
      await Promise.all([
        notifySubscribers(newItems),
        notifyEmailSubscribers(newItems, { ingestAt: ingestedAt }),
      ]);
    }
    return { lastIngestAt: ingestedAt, newCount: newItems.length };
  });
}

async function runIngest() {
  const items = await ingestAllSources();
  return applyIngestResult(items);
}

app.post('/v1/devices/register', optionalRegisterSecret, (req, res) => {
  try {
    const { token, platform, categories, enabled } = req.body || {};
    const device = registerDevice({ token, platform, categories, enabled });
    res.json({ ok: true, device });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.delete('/v1/devices/register', optionalRegisterSecret, (req, res) => {
  const token = req.body?.token || req.query?.token;
  if (!token) {
    res.status(400).json({ error: 'token is required' });
    return;
  }
  unregisterDevice(String(token));
  res.json({ ok: true });
});

app.get('/v1/devices', (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ devices: listDevices() });
});

const subscribeRateLimit = new Map();
const SUBSCRIBE_RATE_MS = 30_000;

function checkSubscribeRateLimit(key) {
  const now = Date.now();
  const last = subscribeRateLimit.get(key);
  if (last && now - last < SUBSCRIBE_RATE_MS) {
    return false;
  }
  subscribeRateLimit.set(key, now);
  return true;
}

app.post('/v1/email/subscribe', (req, res) => {
  try {
    const { email, categories, enabled } = req.body || {};
    const rateKey = `${req.ip || 'unknown'}:${String(email || '').toLowerCase()}`;
    if (!checkSubscribeRateLimit(rateKey)) {
      res.status(429).json({ error: 'Too many requests — try again shortly' });
      return;
    }
    const subscriber = subscribeEmail({ email, categories, enabled });
    res.json({ ok: true, subscriber: { ...subscriber, unsubscribeToken: undefined } });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Subscribe failed' });
  }
});

app.post('/v1/email/unsubscribe', (req, res) => {
  try {
    const email = req.body?.email || req.query?.email;
    if (!email || !isValidEmail(email)) {
      res.status(400).json({ error: 'A valid email address is required' });
      return;
    }
    const removed = unsubscribeEmail(email);
    res.json({ ok: true, removed });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Unsubscribe failed' });
  }
});

app.get('/v1/email/unsubscribe', (req, res) => {
  const token = req.query?.token;
  if (!token) {
    if (req.headers.accept?.includes('application/json')) {
      res.status(400).json({ error: 'token query parameter is required' });
      return;
    }
    res.status(400).type('html').send(unsubscribeHtmlPage(false, 'Missing unsubscribe token.'));
    return;
  }

  const removed = unsubscribeByToken(String(token));
  const wantsJson =
    req.headers.accept?.includes('application/json') ||
    req.query.format === 'json';

  if (wantsJson) {
    res.json({ ok: true, removed });
    return;
  }

  res
    .type('html')
    .send(
      unsubscribeHtmlPage(
        removed,
        removed
          ? 'You have been unsubscribed from Unofficial Cursor News email digests.'
          : 'This unsubscribe link is invalid or has already been used.',
      ),
    );
});

function unsubscribeHtmlPage(success, message) {
  const title = success ? 'Unsubscribed' : 'Unsubscribe';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Unofficial Cursor News</title>
  <style>
    body { font-family: Georgia, serif; background: #f0ebe3; color: #0a0a0f; margin: 0; padding: 48px 16px; }
    .card { max-width: 480px; margin: 0 auto; background: #fffdf9; border: 1px solid #ddd6c8; border-radius: 8px; padding: 32px; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    p { line-height: 1.6; color: #5c5c6a; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

app.get('/v1/email/status', (req, res) => {
  const email = req.query?.email;
  if (!email) {
    res.status(400).json({ error: 'email query parameter is required' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }
  const subscriber = getSubscriber(email);
  res.json({
    subscribed: Boolean(subscriber?.enabled),
    subscriber: subscriber
      ? { ...subscriber, unsubscribeToken: undefined }
      : null,
  });
});

app.get('/v1/email/subscribers', (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({
    subscribers: listSubscribers().map((s) => ({
      ...s,
      unsubscribeToken: undefined,
    })),
  });
});

app.post('/v1/ingest', requireIngestSecret, async (_req, res) => {
  try {
    const items = await ingestAllSources();
    const { lastIngestAt, newCount } = await applyIngestResult(items);
    res.json({
      ok: true,
      count: items.length,
      newCount,
      cachedCount: getStatus().itemCount,
      lastIngestAt,
    });
  } catch (err) {
    console.error('[POST /v1/ingest]', err);
    res.status(500).json({ error: err.message || 'Ingest failed' });
  }
});

async function bootstrapIngestIfEmpty() {
  if (getStatus().itemCount > 0) return;
  try {
    console.log('[bootstrap] Cache empty — running ingest…');
    const { lastIngestAt, newCount } = await runIngest();
    const count = getStatus().itemCount;
    if (count > 0) {
      console.log(`[bootstrap] Ingested ${count} items (${newCount} new)`);
    } else {
      console.warn('[bootstrap] Ingest returned 0 items — cache still empty');
    }
    if (lastIngestAt) {
      console.log(`[bootstrap] lastIngestAt ${lastIngestAt}`);
    }
  } catch (err) {
    console.error('[bootstrap]', err.message || err);
  }
}

function startIngestCron() {
  if (process.env.INGEST_CRON_ENABLED !== 'true') return;

  const schedule = process.env.INGEST_CRON_SCHEDULE?.trim() || '*/30 * * * *';
  if (!cron.validate(schedule)) {
    console.error(`[cron] Invalid INGEST_CRON_SCHEDULE: ${schedule}`);
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      console.log('[cron] Running scheduled ingest…');
      const { lastIngestAt, newCount } = await runIngest();
      console.log(
        JSON.stringify({
          event: 'ingest_cron',
          newCount,
          cachedCount: getStatus().itemCount,
          lastIngestAt,
        }),
      );
    } catch (err) {
      console.error('[cron]', err.message || err);
      console.log(
        JSON.stringify({
          event: 'ingest_cron',
          error: err.message || String(err),
        }),
      );
    }
  });

  console.log(`[cron] Scheduled ingest enabled (${schedule})`);
}

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Unofficial Cursor News API listening on http://0.0.0.0:${port}`);
  bootstrapIngestIfEmpty();
  startIngestCron();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[api] Port ${port} already in use — stop the other process and restart`);
    process.exit(1);
  }
  throw err;
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
