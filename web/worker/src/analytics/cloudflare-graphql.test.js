import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchDailyUniqueVisitors,
  isCloudflareAnalyticsConfigured,
  parseGraphqlDailyUniques,
} from './cloudflare-graphql.js';

describe('cloudflare-graphql', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('parseGraphqlDailyUniques maps zone groups to date rows', () => {
    const rows = parseGraphqlDailyUniques({
      data: {
        viewer: {
          zones: [
            {
              httpRequests1dGroups: [
                { dimensions: { date: '2026-10-20' }, uniq: { uniques: 120 } },
                { dimensions: { date: '2026-10-21' }, uniq: { uniques: 98 } },
              ],
            },
          ],
        },
      },
    });

    assert.deepEqual(rows, [
      { date: '2026-10-20', visitors: 120 },
      { date: '2026-10-21', visitors: 98 },
    ]);
  });

  it('fetchDailyUniqueVisitors returns not configured without token', async () => {
    const result = await fetchDailyUniqueVisitors(
      { CF_ANALYTICS_ZONE_ID: 'zone-1' },
      { startDate: '2026-10-01', endDate: '2026-10-02' },
    );
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'analytics_not_configured');
  });

  it('fetchDailyUniqueVisitors posts GraphQL and parses mocked response', async () => {
    const env = {
      CF_ANALYTICS_TOKEN: 'test-token',
      CF_ANALYTICS_ZONE_ID: 'zone-abc',
    };

    assert.equal(isCloudflareAnalyticsConfigured(env), true);

    mock.method(globalThis, 'fetch', async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.variables.zoneTag, 'zone-abc');
      assert.equal(body.variables.dateGte, '2026-10-20');
      assert.match(init.headers.Authorization, /^Bearer test-token$/);

      return new Response(
        JSON.stringify({
          data: {
            viewer: {
              zones: [
                {
                  httpRequests1dGroups: [
                    { dimensions: { date: '2026-10-20' }, uniq: { uniques: 42 } },
                  ],
                },
              ],
            },
          },
        }),
        { status: 200 },
      );
    });

    const result = await fetchDailyUniqueVisitors(env, {
      startDate: '2026-10-20',
      endDate: '2026-10-20',
      limit: 1,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(result.rows, [{ date: '2026-10-20', visitors: 42 }]);
  });
});
