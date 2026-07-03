import { getCookie, setCookie } from 'hono/cookie';
import { FEED_PUBLISHED_AFTER_ISO } from '../shared/feed/feedPolicy.js';
import { buildFeedPaginationMeta, parseFeedPaginationQuery } from '../shared/feed/feedPagination.js';
import { listSourcesForApi } from '../sources/registry.js';
import { getLastIngestAt, getNews, getStatus } from '../store/news-store.js';
import {
  createSessionId,
  getActiveVisitorCount,
  isValidSessionId,
  pruneStalePresence,
  recordPresence,
} from '../store/site-views.js';
import { listDevices, registerDevice, unregisterDevice } from '../store/device-tokens.js';
import { optionalRegisterSecret, requireIngestSecret } from '../middleware/require-api-secret.js';
import { checkRateLimit, clientRateKey } from '../security/rate-limit.js';
import { publicErrorMessage } from '../security/public-error.js';

const DEVICE_REGISTER_RATE_MS = 60_000;
const PRESENCE_HEARTBEAT_RATE_MS = 15_000;
const PRESENCE_SESSION_COOKIE = 'cain_presence_sid';
const PRESENCE_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const MAX_DEVICE_TOKEN_LENGTH = 512;
import { isScrapeConfigured } from '../ingest/scrape.js';
import { isTwitterApiConfigured } from '../ingest/twitter-api.js';
import { isWorkersAiConfigured } from '../llm/workers-ai-client.js';
import { getStripeMembershipConfigStatus } from '../monetization/stripe-client.js';
import { runIngestWithLock } from '../ingest/run-ingest.js';

export function registerCoreRoutes(app) {
  app.get('/', (c) =>
    c.json({
      ok: true,
      service: 'Cursor AI News API',
      links: { health: '/health', status: '/v1/status' },
    }),
  );

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/v1/status', async (c) => {
    const db = c.env.DB;
    const status = await getStatus(db);
    const payload = {
      ...status,
      sourceCount: listSourcesForApi().filter((s) => s.enabled).length,
      feedPublishedAfter: FEED_PUBLISHED_AFTER_ISO,
    };
    if (c.env.ENVIRONMENT !== 'production') {
      payload.scrapeConfigured = isScrapeConfigured(c.env);
      payload.twitterApiConfigured = isTwitterApiConfigured(c.env);
      payload.workersAiConfigured = isWorkersAiConfigured(c.env);
      payload.stripeMembership = getStripeMembershipConfigStatus(c.env);
    }
    return c.json(payload);
  });

  app.get('/v1/sources', (c) => c.json({ sources: listSourcesForApi() }));

  app.get('/v1/views', async (c) => {
    const db = c.env.DB;
    await pruneStalePresence(db);
    const online = await getActiveVisitorCount(db);
    return c.json({ online });
  });

  app.post('/v1/views', async (c) => {
    const db = c.env.DB;

    if (!checkRateLimit(clientRateKey(c, 'presence-heartbeat'), PRESENCE_HEARTBEAT_RATE_MS)) {
      await pruneStalePresence(db);
      const online = await getActiveVisitorCount(db);
      return c.json({ online, recorded: false }, 429);
    }

    let sessionId = getCookie(c, PRESENCE_SESSION_COOKIE);
    if (!isValidSessionId(sessionId)) {
      sessionId = createSessionId();
    }

    const online = await recordPresence(db, sessionId);
    setCookie(c, PRESENCE_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: PRESENCE_SESSION_MAX_AGE,
    });
    return c.json({ online, recorded: true });
  });

  app.get('/v1/news', async (c) => {
    const db = c.env.DB;
    const { limit, page, offset } = parseFeedPaginationQuery(c.req.query());
    const category = c.req.query('category') ? String(c.req.query('category')) : undefined;
    const official = c.req.query('official') === 'true';
    const sources = c.req.query('sources') ? String(c.req.query('sources')) : undefined;
    const { items, total } = await getNews(db, { category, official, sources, limit, offset });
    return c.json({
      items,
      ...buildFeedPaginationMeta({ total, limit, page, offset, itemCount: items.length }),
      lastIngestAt: await getLastIngestAt(db),
    });
  });

  app.post('/v1/devices/register', optionalRegisterSecret, async (c) => {
    const db = c.env.DB;
    if (!checkRateLimit(clientRateKey(c, 'device-register'), DEVICE_REGISTER_RATE_MS)) {
      return c.json({ error: 'Too many requests — try again shortly' }, 429);
    }
    try {
      const body = await c.req.json().catch(() => ({}));
      const { token, platform, categories, enabled } = body || {};
      const tokenValue = String(token || '').trim();
      if (!tokenValue || tokenValue.length > MAX_DEVICE_TOKEN_LENGTH) {
        return c.json({ error: 'A valid push token is required' }, 400);
      }
      const device = await registerDevice(db, {
        token: tokenValue,
        platform,
        categories,
        enabled,
      });
      return c.json({ ok: true, device });
    } catch (err) {
      return c.json(
        { error: publicErrorMessage(err, 'Registration failed', c.env) },
        400,
      );
    }
  });

  app.delete('/v1/devices/register', optionalRegisterSecret, async (c) => {
    const db = c.env.DB;
    const body = await c.req.json().catch(() => ({}));
    const token = body?.token || c.req.query('token');
    if (!token) {
      return c.json({ error: 'token is required' }, 400);
    }
    await unregisterDevice(db, String(token));
    return c.json({ ok: true });
  });

  app.get('/v1/devices', async (c) => {
    if (c.env.ENVIRONMENT === 'production') {
      return c.json({ error: 'Not found' }, 404);
    }
    const db = c.env.DB;
    return c.json({ devices: await listDevices(db) });
  });

  app.post('/v1/ingest', requireIngestSecret, async (c) => {
    const db = c.env.DB;
    try {
      const result = await runIngestWithLock(db, c.env);
      if (result.skipped) {
        return c.json({ ok: true, skipped: true, reason: result.reason }, 202);
      }
      const status = await getStatus(db);
      return c.json({
        ok: true,
        count: result.count,
        newCount: result.newCount,
        cachedCount: status.itemCount,
        lastIngestAt: result.lastIngestAt,
      });
    } catch (err) {
      console.error('[POST /v1/ingest]', err);
      return c.json({ error: publicErrorMessage(err, 'Ingest failed', c.env) }, 500);
    }
  });
}
