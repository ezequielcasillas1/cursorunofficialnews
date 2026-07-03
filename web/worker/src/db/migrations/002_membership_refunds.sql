-- Membership refund audit trail (apply on existing D1):
--   npx wrangler d1 execute cursorunofficialnews --local --file=web/worker/src/db/migrations/002_membership_refunds.sql
--   npx wrangler d1 execute cursorunofficialnews --remote --file=web/worker/src/db/migrations/002_membership_refunds.sql

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
