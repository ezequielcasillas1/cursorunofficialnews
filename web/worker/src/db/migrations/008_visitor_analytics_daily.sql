-- Daily visitor snapshots (Cloudflare Analytics aggregates, one row per UTC day).
-- Apply locally only until owner runs on production:
--   npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/migrations/008_visitor_analytics_daily.sql

CREATE TABLE IF NOT EXISTS visitor_analytics_daily (
  date TEXT PRIMARY KEY,
  visitors INTEGER NOT NULL,
  captured_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_visitor_analytics_daily_date ON visitor_analytics_daily (date);
