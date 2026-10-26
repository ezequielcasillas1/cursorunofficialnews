import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  fetchDailyUniqueVisitors,
  isCloudflareAnalyticsConfigured,
  isRumAnalyticsConfigured,
  normalizeAnalyticsDateKey,
  parseGraphqlHttpDailyUniques,
  parseGraphqlRumDailyVisits,
} from './cloudflare-graphql.js';

describe('cloudflare-graphql', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('parseGraphqlHttpDailyUniques maps zone groups to date rows', () => {
    const rows = parseGraphqlHttpDailyUniques({
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

  it('normalizeAnalyticsDateKey trims datetime values to UTC date', () => {
    assert.equal(normalizeAnalyticsDateKey('2026-10-20T00:00:00Z'), '2026-10-20');
    assert.equal(normalizeAnalyticsDateKey('2026-10-20'), '2026-10-20');
    assert.equal(normalizeAnalyticsDateKey(''), '');
  });

  it('parseGraphqlRumDailyVisits matches www and apex requestHost', () => {
    const rows = parseGraphqlRumDailyVisits(
      {
        data: {
          viewer: {
            accounts: [
              {
                rumPageloadEventsAdaptiveGroups: [
                  {
                    dimensions: { date: '2026-10-20', requestHost: 'www.cursorunofficial.news' },
                    sum: { visits: 15 },
                  },
                ],
              },
            ],
          },
        },
      },
      { requestHost: 'cursorunofficial.news' },
    );

    assert.deepEqual(rows, [{ date: '2026-10-20', visitors: 15 }]);
  });

  it('parseGraphqlRumDailyVisits sums visits per date and filters requestHost', () => {
    const rows = parseGraphqlRumDailyVisits(
      {
        data: {
          viewer: {
            accounts: [
              {
                rumPageloadEventsAdaptiveGroups: [
                  {
                    dimensions: { date: '2026-10-20', requestHost: 'cursorunofficial.news' },
                    sum: { visits: 40 },
                  },
                  {
                    dimensions: { date: '2026-10-20', requestHost: 'other.example' },
                    sum: { visits: 5 },
                  },
                  {
                    dimensions: { date: '2026-10-21', requestHost: 'cursorunofficial.news' },
                    sum: { visits: 12 },
                  },
                ],
              },
            ],
          },
        },
      },
      { requestHost: 'cursorunofficial.news' },
    );

    assert.deepEqual(rows, [
      { date: '2026-10-20', visitors: 40 },
      { date: '2026-10-21', visitors: 12 },
    ]);
  });

  it('isCloudflareAnalyticsConfigured accepts RUM or zone HTTP credentials', () => {
    assert.equal(isRumAnalyticsConfigured({ CF_ANALYTICS_TOKEN: 't', CF_ANALYTICS_ACCOUNT_ID: 'a', CF_WEB_ANALYTICS_SITE_TAG: 's' }), true);
    assert.equal(isCloudflareAnalyticsConfigured({ CF_ANALYTICS_TOKEN: 't', CF_ANALYTICS_ZONE_ID: 'z' }), true);
    assert.equal(isCloudflareAnalyticsConfigured({ CF_ANALYTICS_ZONE_ID: 'z' }), false);
  });

  it('fetchDailyUniqueVisitors returns not configured without token', async () => {
    const result = await fetchDailyUniqueVisitors(
      { CF_ANALYTICS_ZONE_ID: 'zone-1' },
      { startDate: '2026-10-01', endDate: '2026-10-02' },
    );
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'analytics_not_configured');
  });

  it('fetchDailyUniqueVisitors uses RUM when account and site tag are set', async () => {
    const env = {
      CF_ANALYTICS_TOKEN: 'test-token',
      CF_ANALYTICS_ACCOUNT_ID: 'acct-1',
      CF_WEB_ANALYTICS_SITE_TAG: 'site-abc',
      CF_ANALYTICS_ZONE_ID: 'zone-fallback',
    };

    mock.method(globalThis, 'fetch', async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.match(body.query, /rumPageloadEventsAdaptiveGroups/);
      assert.equal(body.variables.accountTag, 'acct-1');
      assert.equal(body.variables.siteTag, 'site-abc');
      assert.equal(body.variables.datetimeGte, '2026-10-20T00:00:00Z');
      assert.match(init.headers.Authorization, /^Bearer test-token$/);

      return new Response(
        JSON.stringify({
          data: {
            viewer: {
              accounts: [
                {
                  rumPageloadEventsAdaptiveGroups: [
                    {
                      dimensions: { date: '2026-10-20', requestHost: 'cursorunofficial.news' },
                      sum: { visits: 42 },
                    },
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
    assert.equal(result.analyticsMode, 'rum');
    assert.equal(result.includesBots, false);
    assert.deepEqual(result.rows, [{ date: '2026-10-20', visitors: 42 }]);
  });

  it('fetchDailyUniqueVisitors falls back to zone HTTP when RUM returns no rows', async () => {
    const env = {
      CF_ANALYTICS_TOKEN: 'test-token',
      CF_ANALYTICS_ACCOUNT_ID: 'acct-1',
      CF_WEB_ANALYTICS_SITE_TAG: 'site-abc',
      CF_ANALYTICS_ZONE_ID: 'zone-abc',
    };

    let call = 0;
    mock.method(globalThis, 'fetch', async (_url, init) => {
      call += 1;
      const body = JSON.parse(init.body);

      if (call === 1) {
        assert.match(body.query, /rumPageloadEventsAdaptiveGroups/);
        return new Response(
          JSON.stringify({
            data: {
              viewer: {
                accounts: [{ rumPageloadEventsAdaptiveGroups: [] }],
              },
            },
          }),
          { status: 200 },
        );
      }

      assert.match(body.query, /httpRequests1dGroups/);
      return new Response(
        JSON.stringify({
          data: {
            viewer: {
              zones: [
                {
                  httpRequests1dGroups: [
                    { dimensions: { date: '2026-10-20' }, uniq: { uniques: 55 } },
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

    assert.equal(call, 2);
    assert.equal(result.analyticsMode, 'http_includes_bots');
    assert.deepEqual(result.rows, [{ date: '2026-10-20', visitors: 55 }]);
  });

  it('fetchDailyUniqueVisitors falls back to zone HTTP without requestSource when RUM fails', async () => {
    const env = {
      CF_ANALYTICS_TOKEN: 'test-token',
      CF_ANALYTICS_ACCOUNT_ID: 'acct-1',
      CF_WEB_ANALYTICS_SITE_TAG: 'site-abc',
      CF_ANALYTICS_ZONE_ID: 'zone-abc',
    };

    let call = 0;
    mock.method(globalThis, 'fetch', async (_url, init) => {
      call += 1;
      const body = JSON.parse(init.body);

      if (call === 1) {
        assert.match(body.query, /rumPageloadEventsAdaptiveGroups/);
        return new Response(
          JSON.stringify({ errors: [{ message: 'site not found' }] }),
          { status: 200 },
        );
      }

      assert.match(body.query, /httpRequests1dGroups/);
      assert.equal(body.variables.zoneTag, 'zone-abc');
      assert.equal(body.query.includes('requestSource'), false);

      return new Response(
        JSON.stringify({
          data: {
            viewer: {
              zones: [
                {
                  httpRequests1dGroups: [
                    { dimensions: { date: '2026-10-20' }, uniq: { uniques: 99 } },
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

    assert.equal(call, 2);
    assert.equal(result.ok, true);
    assert.equal(result.analyticsMode, 'http_includes_bots');
    assert.equal(result.includesBots, true);
    assert.deepEqual(result.rows, [{ date: '2026-10-20', visitors: 99 }]);
  });

  it('fetchDailyUniqueVisitors uses zone HTTP when only zone credentials exist', async () => {
    const env = {
      CF_ANALYTICS_TOKEN: 'test-token',
      CF_ANALYTICS_ZONE_ID: 'zone-only',
    };

    mock.method(globalThis, 'fetch', async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.match(body.query, /httpRequests1dGroups/);
      assert.equal(body.query.includes('requestSource'), false);

      return new Response(
        JSON.stringify({
          data: {
            viewer: {
              zones: [
                {
                  httpRequests1dGroups: [
                    { dimensions: { date: '2026-10-19' }, uniq: { uniques: 7 } },
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
      startDate: '2026-10-19',
      endDate: '2026-10-19',
    });

    assert.equal(result.analyticsMode, 'http_includes_bots');
    assert.deepEqual(result.rows, [{ date: '2026-10-19', visitors: 7 }]);
  });
});
