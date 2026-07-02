-- D1 schema for the Cursor AI News API (single database, replaces the
-- fs/JSON stores in mobile/server/src/store/*). Run once via:
--   npx wrangler d1 execute cursorunofficialnews --file=web/worker/src/db/schema.sql

CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  canonical_url TEXT NOT NULL DEFAULT '',
  published_at TEXT,
  category TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_name TEXT,
  attribution_label TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items (published_at);
CREATE INDEX IF NOT EXISTS idx_news_items_category ON news_items (category);
CREATE INDEX IF NOT EXISTS idx_news_items_source_id ON news_items (source_id);

-- Historical dedupe set for diff-new-items (separate from news_items, which
-- only holds the current visible window — an id can roll off news_items but
-- must stay "known" so it never re-triggers a notification).
CREATE TABLE IF NOT EXISTS known_items (
  id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS device_tokens (
  token TEXT PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'unknown',
  categories_json TEXT NOT NULL DEFAULT '[]',
  enabled INTEGER NOT NULL DEFAULT 1,
  registered_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_subscribers (
  email TEXT PRIMARY KEY,
  categories_json TEXT NOT NULL DEFAULT '[]',
  category_limits_json TEXT NOT NULL DEFAULT '{}',
  official_only INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0,
  verification_token TEXT,
  verification_expires_at TEXT,
  manage_token TEXT NOT NULL,
  subscribed_at TEXT NOT NULL,
  verified_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_verification_token ON email_subscribers (verification_token);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_manage_token ON email_subscribers (manage_token);

-- DEPRECATED / RETIRED — Buy Me a Coffee membership, replaced by Stripe (see
-- `memberships` below). Kept only so existing prod rows aren't dropped by this
-- migration; no route reads/writes this table anymore. Manually archive/drop
-- once any legacy BMC members have been reconciled — see docs/STRIPE-GO-LIVE.md.
CREATE TABLE IF NOT EXISTS bmc_members (
  email TEXT PRIMARY KEY,
  ad_free_token TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'cancelled',
  membership_started_at TEXT,
  paused_at TEXT,
  cancelled_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bmc_members_ad_free_token ON bmc_members (ad_free_token);

-- Stripe-backed membership — single source of truth for both ad-free browsing
-- and the email newsletter entitlement (see store/memberships.js:getEntitlement).
CREATE TABLE IF NOT EXISTS memberships (
  email TEXT PRIMARY KEY,
  membership_token TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount_cents INTEGER,
  active INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'cancelled',
  membership_started_at TEXT,
  paused_at TEXT,
  cancelled_at TEXT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_memberships_membership_token ON memberships (membership_token);
CREATE INDEX IF NOT EXISTS idx_memberships_stripe_customer_id ON memberships (stripe_customer_id);

CREATE TABLE IF NOT EXISTS membership_claim_requests (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_membership_claim_requests_email ON membership_claim_requests (email);

-- Single-row ingest guard. acquireIngestLock() does an atomic
-- UPDATE ... WHERE running = 0, relying on D1's single-writer semantics
-- instead of the in-process Promise mutex the Express server used.
CREATE TABLE IF NOT EXISTS ingest_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  running INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  last_ingest_at TEXT
);
INSERT OR IGNORE INTO ingest_state (id, running, started_at, last_ingest_at) VALUES (1, 0, NULL, NULL);
