const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const DAILY_UNIQUES_QUERY = `
query DailyVisitorUniques(
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
          requestSource: "eyeball"
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

export function isCloudflareAnalyticsConfigured(env) {
  return Boolean(String(env?.CF_ANALYTICS_TOKEN || '').trim() && String(env?.CF_ANALYTICS_ZONE_ID || '').trim());
}

export function parseGraphqlDailyUniques(payload) {
  const groups = payload?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if (!Array.isArray(groups)) return [];
  return groups.map((entry) => ({
    date: entry.dimensions?.date,
    visitors: Number(entry.uniq?.uniques ?? 0),
  }));
}

/**
 * @param {Record<string, string>} env
 * @param {{ startDate: string, endDate: string, limit?: number }} range
 */
export async function fetchDailyUniqueVisitors(env, { startDate, endDate, limit = 31 }) {
  if (!isCloudflareAnalyticsConfigured(env)) {
    return { ok: false, reason: 'analytics_not_configured', rows: [] };
  }

  const zoneTag = String(env.CF_ANALYTICS_ZONE_ID).trim();
  const token = String(env.CF_ANALYTICS_TOKEN).trim();

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: DAILY_UNIQUES_QUERY,
      variables: {
        zoneTag,
        dateGte: startDate,
        dateLte: endDate,
        limit: Math.min(Math.max(1, limit), 366),
      },
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.errors?.length) {
    const message = body.errors?.[0]?.message || `GraphQL HTTP ${response.status}`;
    return { ok: false, reason: 'analytics_fetch_failed', rows: [], message };
  }

  const rows = parseGraphqlDailyUniques(body).filter((row) => row.date);
  return { ok: true, rows };
}

export async function fetchSingleDayUniqueVisitors(env, date) {
  const result = await fetchDailyUniqueVisitors(env, {
    startDate: date,
    endDate: date,
    limit: 1,
  });
  if (!result.ok) return result;
  const visitors = result.rows[0]?.visitors ?? 0;
  return { ok: true, date, visitors };
}
