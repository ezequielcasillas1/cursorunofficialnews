-- Site view counter (apply on existing D1):
--   npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/migrations/004_site_views.sql
--   npx wrangler d1 execute cursorunofficialnews --remote --file=web/worker/src/db/migrations/004_site_views.sql

CREATE TABLE IF NOT EXISTS site_stats (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  view_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO site_stats (id, view_count) VALUES (1, 0);
