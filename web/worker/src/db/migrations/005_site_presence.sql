-- Live visitor presence (apply on existing D1):
--   npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/migrations/005_site_presence.sql
--   npx wrangler d1 execute cursorunofficialnews --remote --file=web/worker/src/db/migrations/005_site_presence.sql

CREATE TABLE IF NOT EXISTS site_presence (
  session_id TEXT PRIMARY KEY,
  last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_site_presence_last_seen ON site_presence (last_seen);
