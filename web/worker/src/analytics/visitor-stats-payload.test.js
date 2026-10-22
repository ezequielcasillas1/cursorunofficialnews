import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildDevSampleVisitorAggregates, buildPublicVisitorStats } from './visitor-stats-payload.js';

function createAnalyticsDb() {
  return {
    prepare(sql) {
      const query = String(sql);
      return {
        bind() {
          return {
            async run() {
              if (query.includes('CREATE TABLE') || query.includes('CREATE INDEX')) {
                return { meta: { changes: 0 } };
              }
              return { meta: { changes: 0 } };
            },
            async all() {
              if (query.includes('visitor_analytics_daily')) {
                return { results: [] };
              }
              return { results: [] };
            },
            async first() {
              return null;
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

describe('visitor-stats-payload', () => {
  it('buildDevSampleVisitorAggregates returns 30 days of labeled sample data', () => {
    const today = '2026-10-22';
    const sample = buildDevSampleVisitorAggregates({
      today,
      start7: '2026-10-16',
      start30: '2026-09-23',
    });

    assert.equal(sample.sampleData, true);
    assert.equal(sample.aggregatesSource, 'dev_sample');
    assert.equal(sample.history.length, 30);
    assert.ok(sample.today > 0);
    assert.ok(sample.last7Days >= sample.today);
    assert.ok(sample.last30Days >= sample.last7Days);
  });

  it('buildPublicVisitorStats uses dev sample when analytics missing in development', async () => {
    const db = createAnalyticsDb();
    const stats = await buildPublicVisitorStats(db, { ENVIRONMENT: 'development' }, { online: 2 });

    assert.equal(stats.sampleData, true);
    assert.equal(stats.aggregatesSource, 'dev_sample');
    assert.equal(stats.online, 2);
    assert.ok(stats.history.length === 30);
  });

  it('buildPublicVisitorStats never fakes numbers in production without analytics', async () => {
    const db = createAnalyticsDb();
    const stats = await buildPublicVisitorStats(db, { ENVIRONMENT: 'production' }, { online: 1 });

    assert.equal(stats.sampleData, false);
    assert.equal(stats.aggregatesSource, 'unavailable');
    assert.equal(stats.today, null);
    assert.equal(stats.last7Days, null);
    assert.equal(stats.last30Days, null);
    assert.deepEqual(stats.history, []);
  });
});
