import { fetchDailyUniqueVisitors } from './cloudflare-graphql.js';
import {
  listDailyVisitorSnapshots,
  sumVisitorsInRange,
  upsertDailyVisitorSnapshot,
} from '../store/visitor-analytics-daily.js';

function utcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(dateKey, deltaDays) {
  const base = new Date(`${dateKey}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + deltaDays);
  return utcDateKey(base);
}

function mergeHistoryRows(dbRows, liveRows) {
  const byDate = new Map();
  for (const row of dbRows) {
    byDate.set(row.date, row.visitors);
  }
  for (const row of liveRows) {
    byDate.set(row.date, row.visitors);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, visitors]) => ({ date, visitors }));
}

/**
 * Build public aggregate visitor stats (no PII, no secrets).
 */
export async function buildPublicVisitorStats(db, env, { online } = {}) {
  const today = utcDateKey();
  const start30 = addUtcDays(today, -29);
  const start7 = addUtcDays(today, -6);

  const dbHistory = await listDailyVisitorSnapshots(db, {
    since: start30,
    until: today,
    limit: 31,
  });

  let aggregatesSource = 'd1_snapshots';
  let liveRows = [];

  const live = await fetchDailyUniqueVisitors(env, {
    startDate: start30,
    endDate: today,
    limit: 31,
  });

  if (live.ok) {
    aggregatesSource = 'cloudflare';
    liveRows = live.rows;
  }

  const history = mergeHistoryRows(dbHistory, liveRows);

  const todayVisitors =
    liveRows.find((row) => row.date === today)?.visitors ??
    dbHistory.find((row) => row.date === today)?.visitors ??
    null;

  const last7Days = sumVisitorsInRange(history, start7, today);
  const last30Days = sumVisitorsInRange(history, start30, today);

  return {
    online: typeof online === 'number' ? online : 0,
    today: todayVisitors,
    last7Days: live.ok || dbHistory.length ? last7Days : null,
    last30Days: live.ok || dbHistory.length ? last30Days : null,
    history,
    aggregatesSource: live.ok ? aggregatesSource : dbHistory.length ? 'd1_snapshots' : 'unavailable',
    asOf: new Date().toISOString(),
  };
}

/** Persist yesterday's (or given) unique visitors into D1 — idempotent per date. */
export async function snapshotVisitorDay(db, env, dateKey) {
  const result = await fetchDailyUniqueVisitors(env, {
    startDate: dateKey,
    endDate: dateKey,
    limit: 1,
  });

  if (!result.ok) {
    return { skipped: true, reason: result.reason, date: dateKey };
  }

  const visitors = result.rows[0]?.visitors ?? 0;
  await upsertDailyVisitorSnapshot(db, dateKey, visitors);
  return { ok: true, date: dateKey, visitors };
}

export function yesterdayUtcDateKey(now = new Date()) {
  return addUtcDays(utcDateKey(now), -1);
}
