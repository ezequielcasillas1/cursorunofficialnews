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
  blocked INTEGER NOT NULL DEFAULT 0,
  access_source TEXT,
  intruder_flagged_at TEXT,
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

-- Local admin only (intruder detection + manual overrides) — not used in production deploy.
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

-- Refund audit trail — one row per refund attempt (see store/membership-refunds.js).
CREATE TABLE IF NOT EXISTS membership_refunds (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT NOT NULL,
  stripe_refund_id TEXT,
  stripe_charge_id TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  refunded_amount_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  idempotency_key TEXT NOT NULL UNIQUE,
  reason TEXT,
  failure_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_membership_refunds_email ON membership_refunds (email);
CREATE INDEX IF NOT EXISTS idx_membership_refunds_subscription ON membership_refunds (stripe_subscription_id);
