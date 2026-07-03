-- Membership admin columns + audit tables (additive — safe on prod D1 before deploy).
-- Admin API/UI remain local-only (404 in production via requireLocalAdmin middleware).
-- Apply locally:
--   npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/migrations/003_membership_admin.sql
-- Apply remote before deploying worker code that references blocked/access_source:
--   npx wrangler d1 execute cursorunofficialnews --remote --file=web/worker/src/db/migrations/003_membership_admin.sql

ALTER TABLE memberships ADD COLUMN blocked INTEGER NOT NULL DEFAULT 0;
ALTER TABLE memberships ADD COLUMN access_source TEXT;
ALTER TABLE memberships ADD COLUMN intruder_flagged_at TEXT;

CREATE TABLE IF NOT EXISTS membership_access_overrides (
  email TEXT PRIMARY KEY,
  override_status TEXT NOT NULL CHECK (override_status IN ('allow', 'block')),
  reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_admin_audit (
  id TEXT PRIMARY KEY,
  email TEXT,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'system',
  detail_json TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_membership_admin_audit_email ON membership_admin_audit (email);
CREATE INDEX IF NOT EXISTS idx_membership_admin_audit_created_at ON membership_admin_audit (created_at);
