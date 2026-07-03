-- Queue new items between scheduled digest sends (default 1pm America/Chicago).
CREATE TABLE IF NOT EXISTS digest_queue (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  canonical_url TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  category TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT,
  attribution_label TEXT,
  queued_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_digest_queue_queued_at ON digest_queue (queued_at);
CREATE INDEX IF NOT EXISTS idx_digest_queue_category ON digest_queue (category);

ALTER TABLE ingest_state ADD COLUMN last_digest_slot TEXT;
