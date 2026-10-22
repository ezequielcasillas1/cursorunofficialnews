const VISITOR_ANALYTICS_DDL = [
  `CREATE TABLE IF NOT EXISTS visitor_analytics_daily (
    date TEXT PRIMARY KEY,
    visitors INTEGER NOT NULL,
    captured_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  'CREATE INDEX IF NOT EXISTS idx_visitor_analytics_daily_date ON visitor_analytics_daily (date)',
];

let tableReady = false;

export async function ensureVisitorAnalyticsTable(db) {
  if (tableReady) return;
  for (const sql of VISITOR_ANALYTICS_DDL) {
    await db.prepare(sql).run();
  }
  tableReady = true;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDateKey(value) {
  return DATE_RE.test(String(value || '').trim());
}

export async function upsertDailyVisitorSnapshot(db, date, visitors) {
  if (!isIsoDateKey(date)) {
    throw new Error('Invalid analytics date');
  }
  const count = Math.max(0, Math.floor(Number(visitors) || 0));
  await ensureVisitorAnalyticsTable(db);
  await db
    .prepare(
      `INSERT INTO visitor_analytics_daily (date, visitors, captured_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(date) DO UPDATE SET
         visitors = excluded.visitors,
         captured_at = datetime('now')`,
    )
    .bind(date, count)
    .run();
  return { date, visitors: count };
}

export async function listDailyVisitorSnapshots(db, { since, until, limit = 90 } = {}) {
  await ensureVisitorAnalyticsTable(db);
  const clauses = [];
  const params = [];

  if (since && isIsoDateKey(since)) {
    clauses.push('date >= ?');
    params.push(since);
  }
  if (until && isIsoDateKey(until)) {
    clauses.push('date <= ?');
    params.push(until);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(1, Number(limit) || 90), 366);

  const { results } = await db
    .prepare(
      `SELECT date, visitors
       FROM visitor_analytics_daily
       ${where}
       ORDER BY date ASC
       LIMIT ?`,
    )
    .bind(...params, safeLimit)
    .all();

  return (results || []).map((row) => ({
    date: row.date,
    visitors: Number(row.visitors ?? 0),
  }));
}

export function sumVisitorsInRange(rows, startDate, endDate) {
  let total = 0;
  for (const row of rows) {
    if (row.date >= startDate && row.date <= endDate) {
      total += row.visitors;
    }
  }
  return total;
}
