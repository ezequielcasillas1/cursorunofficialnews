const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const RUM_DAILY_VISITS_QUERY = `
query RumDailyVisits(
  $accountTag: String!
  $siteTag: String!
  $datetimeGte: Time!
  $datetimeLeq: Time!
  $limit: uint64!
) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      rumPageloadEventsAdaptiveGroups(
        limit: $limit
        orderBy: [date_ASC]
        filter: {
          siteTag: $siteTag
          datetime_geq: $datetimeGte
          datetime_leq: $datetimeLeq
        }
      ) {
        dimensions {
          date
          requestHost
        }
        sum {
          visits
        }
      }
    }
  }
}
`;

const HTTP_DAILY_UNIQUES_QUERY = `
query HttpDailyVisitorUniques(
  $zoneTag: string!
  $dateGte: Date!
  $dateLte: Date!
  $limit: uint64!
) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(
        limit: $limit
        orderBy: [date_ASC]
        filter: {
          date_geq: $dateGte
          date_leq: $dateLte
        }
      ) {
        dimensions {
          date
        }
        uniq {
          uniques
        }
      }
    }
  }
}
`;

function trimEnv(value) {
  return String(value ?? '').trim();
}

export function isRumAnalyticsConfigured(env) {
  return Boolean(
    trimEnv(env?.CF_ANALYTICS_TOKEN) &&
      trimEnv(env?.CF_ANALYTICS_ACCOUNT_ID) &&
      trimEnv(env?.CF_WEB_ANALYTICS_SITE_TAG),
  );
}

export function isZoneHttpAnalyticsConfigured(env) {
  return Boolean(trimEnv(env?.CF_ANALYTICS_TOKEN) && trimEnv(env?.CF_ANALYTICS_ZONE_ID));
}

/** True when the Worker can request at least one aggregate source (RUM preferred). */
export function isCloudflareAnalyticsConfigured(env) {
  return isRumAnalyticsConfigured(env) || isZoneHttpAnalyticsConfigured(env);
}

export function parseGraphqlHttpDailyUniques(payload) {
  const groups = payload?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if (!Array.isArray(groups)) return [];
  return groups.map((entry) => ({
    date: entry.dimensions?.date,
    visitors: Number(entry.uniq?.uniques ?? 0),
  }));
}

/**
 * @param {unknown} payload
 * @param {{ requestHost?: string }} [options]
 */
export function parseGraphqlRumDailyVisits(payload, { requestHost } = {}) {
  const groups = payload?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (!Array.isArray(groups)) return [];

  const hostFilter = trimEnv(requestHost).toLowerCase();
  const byDate = new Map();

  for (const entry of groups) {
    const date = entry.dimensions?.date;
    if (!date) continue;

    const host = trimEnv(entry.dimensions?.requestHost).toLowerCase();
    if (hostFilter && host && host !== hostFilter) continue;

    const visits = Number(entry.sum?.visits ?? 0);
    byDate.set(date, (byDate.get(date) ?? 0) + visits);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, visitors]) => ({ date, visitors }));
}

function dateRangeToDateTimeBounds(startDate, endDate) {
  return {
    datetimeGte: `${startDate}T00:00:00Z`,
    datetimeLeq: `${endDate}T23:59:59Z`,
  };
}

async function postGraphql(token, query, variables) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = await response.json().catch(() => ({}));
  const message = body.errors?.[0]?.message || (!response.ok ? `GraphQL HTTP ${response.status}` : null);

  if (!response.ok || body.errors?.length) {
    return { ok: false, body, message: message || 'analytics_fetch_failed' };
  }

  return { ok: true, body };
}

/**
 * @param {Record<string, string>} env
 * @param {{ startDate: string, endDate: string, limit?: number }} range
 */
export async function fetchDailyUniqueVisitors(env, { startDate, endDate, limit = 31 }) {
  if (!isCloudflareAnalyticsConfigured(env)) {
    return { ok: false, reason: 'analytics_not_configured', rows: [] };
  }

  const token = trimEnv(env.CF_ANALYTICS_TOKEN);
  const boundedLimit = Math.min(Math.max(1, limit), 366);
  const requestHost = trimEnv(env.CF_ANALYTICS_REQUEST_HOST);

  if (isRumAnalyticsConfigured(env)) {
    const accountTag = trimEnv(env.CF_ANALYTICS_ACCOUNT_ID);
    const siteTag = trimEnv(env.CF_WEB_ANALYTICS_SITE_TAG);
    const { datetimeGte, datetimeLeq } = dateRangeToDateTimeBounds(startDate, endDate);

    const rum = await postGraphql(token, RUM_DAILY_VISITS_QUERY, {
      accountTag,
      siteTag,
      datetimeGte,
      datetimeLeq,
      limit: boundedLimit,
    });

    if (rum.ok) {
      const rows = parseGraphqlRumDailyVisits(rum.body, { requestHost }).filter((row) => row.date);
      return {
        ok: true,
        rows,
        analyticsMode: 'rum',
        includesBots: false,
      };
    }

    if (!isZoneHttpAnalyticsConfigured(env)) {
      return {
        ok: false,
        reason: 'analytics_fetch_failed',
        rows: [],
        message: rum.message,
      };
    }
  }

  const zoneTag = trimEnv(env.CF_ANALYTICS_ZONE_ID);
  const http = await postGraphql(token, HTTP_DAILY_UNIQUES_QUERY, {
    zoneTag,
    dateGte: startDate,
    dateLte: endDate,
    limit: boundedLimit,
  });

  if (!http.ok) {
    return {
      ok: false,
      reason: 'analytics_fetch_failed',
      rows: [],
      message: http.message,
    };
  }

  const rows = parseGraphqlHttpDailyUniques(http.body).filter((row) => row.date);
  return {
    ok: true,
    rows,
    analyticsMode: 'http_includes_bots',
    includesBots: true,
  };
}

export async function fetchSingleDayUniqueVisitors(env, date) {
  const result = await fetchDailyUniqueVisitors(env, {
    startDate: date,
    endDate: date,
    limit: 1,
  });
  if (!result.ok) return result;
  const visitors = result.rows[0]?.visitors ?? 0;
  return { ok: true, date, visitors, analyticsMode: result.analyticsMode, includesBots: result.includesBots };
}

/** @deprecated use parseGraphqlHttpDailyUniques */
export const parseGraphqlDailyUniques = parseGraphqlHttpDailyUniques;
