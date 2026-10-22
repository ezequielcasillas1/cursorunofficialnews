import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.js';
import {
  createSessionId,
  getActiveVisitorCount,
  recordPresence,
} from '../store/site-views.js';

function createStatsDb() {
  const sessions = new Map();
  const analytics = new Map();

  return {
    sessions,
    analytics,
    prepare(sql) {
      const query = String(sql);
      return {
        bind(...params) {
          return {
            async run() {
              if (query.includes('CREATE TABLE') || query.includes('CREATE INDEX')) {
                return { meta: { changes: 0 } };
              }
              if (query.includes('visitor_analytics_daily')) {
                if (query.includes('INSERT INTO visitor_analytics_daily')) {
                  const [date, visitors] = params;
                  analytics.set(date, visitors);
                }
                return { meta: { changes: 1 } };
              }
              if (query.includes('INSERT INTO site_presence')) {
                sessions.set(params[0], new Date().toISOString());
                return { meta: { changes: 1 } };
              }
              if (query.includes('DELETE FROM site_presence')) {
                return { meta: { changes: 0 } };
              }
              return { meta: { changes: 0 } };
            },
            async first() {
              if (query.includes('SELECT COUNT(*) AS count FROM site_presence')) {
                return { count: sessions.size };
              }
              return null;
            },
            async all() {
              if (query.includes('FROM visitor_analytics_daily')) {
                const rows = [...analytics.entries()]
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, visitors]) => ({ date, visitors }));
                return { results: rows };
              }
              return { results: [] };
            },
          };
        },
        async run() {
          return { meta: { changes: 0 } };
        },
      };
    },
  };
}

function makeEnv(db) {
  return {
    ENVIRONMENT: 'test',
    DB: db,
  };
}

describe('public visitor stats API', () => {
  it('does not expose analytics token or per-visitor fields', async () => {
    const env = makeEnv(createStatsDb());
    const app = createApp();
    const res = await app.request('http://localhost/api/v1/public/visitor-stats', {}, env);
    const body = await res.json();
    const serialized = JSON.stringify(body);

    assert.equal(res.status, 200);
    assert.equal(body.CF_ANALYTICS_TOKEN, undefined);
    assert.equal(body.token, undefined);
    assert.equal(serialized.includes('CF_ANALYTICS'), false);
    assert.equal(Array.isArray(body.history), true);
    assert.equal(typeof body.online, 'number');
    assert.equal(body.sampleData, true);
    assert.equal(body.aggregatesSource, 'dev_sample');
  });

  it('returns unavailable aggregates in production without analytics', async () => {
    const env = makeEnv(createStatsDb());
    env.ENVIRONMENT = 'production';
    const app = createApp();
    const res = await app.request('http://localhost/api/v1/public/visitor-stats', {}, env);
    const body = await res.json();

    assert.equal(body.aggregatesSource, 'unavailable');
    assert.equal(body.sampleData, false);
    assert.equal(body.today, null);
    assert.equal(body.history.length, 0);
  });

  it('ignores bot heartbeats for presence counts', async () => {
    const db = createStatsDb();
    const env = makeEnv(db);
    const app = createApp();
    const humanId = createSessionId();

    await recordPresence(db, humanId);
    assert.equal(await getActiveVisitorCount(db), 1);

    const botRes = await app.request(
      'http://localhost/api/v1/views',
      {
        method: 'POST',
        headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
      },
      env,
    );
    const botBody = await botRes.json();

    assert.equal(botBody.recorded, false);
    assert.equal(botBody.reason, 'automated_client');
    assert.equal(await getActiveVisitorCount(db), 1);

    const humanRes = await app.request(
      'http://localhost/api/v1/views',
      {
        method: 'POST',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        },
      },
      env,
    );
    const humanBody = await humanRes.json();
    assert.equal(humanBody.recorded, true);
    assert.equal(await getActiveVisitorCount(db), 2);
  });
});
