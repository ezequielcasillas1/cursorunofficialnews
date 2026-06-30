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
import { FEED_PUBLISHED_AFTER_ISO } from '../../shared/feed/feedPolicy.js';
import {
  buildFeedPaginationMeta,
  parseFeedPaginationQuery,
} from '../../shared/feed/feedPagination.js';
import { listSourcesForApi } from './sources/registry.js';
import {
  getLastIngestAt,
  getNews,
  getStatus,
  replaceItems,
  setLastIngestAt,
} from './store/memory-cache.js';
import { registerEmailRoutes } from './notifications/email-routes.js';
import {
  listDevices,
  registerDevice,
  unregisterDevice,
} from './store/device-tokens.js';
import { handleBmcWebhook } from './monetization/bmc-webhook.js';
import { registerMembershipRoutes } from './monetization/membership-routes.js';
import { createCorsOptions } from './security/cors-options.js';
import { isLmStudioConfigured } from './llm/config.js';
import { registerLlmRoutes } from './llm/llm-routes.js';

const app = express();
const port = Number(process.env.PORT || 8787);

app.disable('x-powered-by');
app.use(cors(createCorsOptions()));
app.use((req, res, next) => {
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  next();
});

app.post(
  '/v1/bmc/webhook',
  express.raw({ type: 'application/json' }),
  handleBmcWebhook,
);

app.use(express.json({ limit: '64kb' }));
registerMembershipRoutes(app);
registerEmailRoutes(app);
registerLlmRoutes(app);

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
  const payload = {
    ...getStatus(),
    sourceCount: listSourcesForApi().filter((s) => s.enabled).length,
    feedPublishedAfter: FEED_PUBLISHED_AFTER_ISO,
  };
  if (process.env.NODE_ENV !== 'production') {
    payload.scrapeConfigured = isScrapeConfigured();
    payload.twitterApiConfigured = isTwitterApiConfigured();
    payload.lmStudioConfigured = isLmStudioConfigured();
  }
  res.json(payload);
});

app.get('/v1/sources', (_req, res) => {
  res.json({ sources: listSourcesForApi() });
});

app.get('/v1/news', (req, res) => {
  const { limit, page, offset } = parseFeedPaginationQuery(req.query);
  const category = req.query.category ? String(req.query.category) : undefined;
  const official = req.query.official === 'true';
  const { items, total } = getNews({
    category,
    official,
    limit,
    offset,
  });
  res.json({
    items,
    ...buildFeedPaginationMeta({
      total,
      limit,
      page,
      offset,
      itemCount: items.length,
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
