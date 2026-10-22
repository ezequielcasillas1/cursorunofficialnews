import { randomToken } from '../lib/crypto.js';
import { normalizeEmail } from './email-subscribers.js';

const TERMINAL_STATUSES = new Set(['succeeded', 'pending']);

function rowToRefund(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeRefundId: row.stripe_refund_id || null,
    stripeChargeId: row.stripe_charge_id || null,
    stripeInvoiceId: row.stripe_invoice_id || null,
    stripePaymentIntentId: row.stripe_payment_intent_id || null,
    amountCents: row.amount_cents,
    refundedAmountCents: row.refunded_amount_cents ?? null,
    status: row.status,
    idempotencyKey: row.idempotency_key,
    reason: row.reason || null,
    failureMessage: row.failure_message || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getRefundBySubscriptionId(db, stripeSubscriptionId) {
  if (!stripeSubscriptionId) return null;
  return rowToRefund(
    await db
      .prepare(
        `SELECT * FROM membership_refunds
         WHERE stripe_subscription_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
      )
      .bind(stripeSubscriptionId)
      .first(),
  );
}

export async function getRefundByStripeRefundId(db, stripeRefundId) {
  if (!stripeRefundId) return null;
  return rowToRefund(
    await db
      .prepare('SELECT * FROM membership_refunds WHERE stripe_refund_id = ?')
      .bind(stripeRefundId)
      .first(),
  );
}

export async function getRefundByIdempotencyKey(db, idempotencyKey) {
  if (!idempotencyKey) return null;
  return rowToRefund(
    await db
      .prepare('SELECT * FROM membership_refunds WHERE idempotency_key = ?')
      .bind(idempotencyKey)
      .first(),
  );
}

export async function createRefundRequest(
  db,
  {
    email,
    stripeCustomerId,
    stripeSubscriptionId,
    amountCents,
    idempotencyKey,
    reason,
  },
) {
  const normalized = normalizeEmail(email);
  const now = new Date().toISOString();
  const record = {
    id: randomToken(16),
    email: normalized,
    stripeCustomerId: stripeCustomerId || null,
    stripeSubscriptionId,
    amountCents,
    idempotencyKey,
    reason: reason || 'requested_by_customer',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await db
    .prepare(
      `INSERT INTO membership_refunds
         (id, email, stripe_customer_id, stripe_subscription_id, amount_cents, status, idempotency_key, reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      record.id,
      record.email,
      record.stripeCustomerId,
      record.stripeSubscriptionId,
      record.amountCents,
      record.status,
      record.idempotencyKey,
      record.reason,
      record.createdAt,
      record.updatedAt,
    )
    .run();

  return record;
}

export async function updateRefundStatus(db, id, patch = {}) {
  const now = new Date().toISOString();
  await db
    .prepare(
      `UPDATE membership_refunds SET
         stripe_refund_id = COALESCE(?, stripe_refund_id),
         stripe_charge_id = COALESCE(?, stripe_charge_id),
         stripe_invoice_id = COALESCE(?, stripe_invoice_id),
         stripe_payment_intent_id = COALESCE(?, stripe_payment_intent_id),
         refunded_amount_cents = COALESCE(?, refunded_amount_cents),
         status = COALESCE(?, status),
         failure_message = COALESCE(?, failure_message),
         updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      patch.stripeRefundId ?? null,
      patch.stripeChargeId ?? null,
      patch.stripeInvoiceId ?? null,
      patch.stripePaymentIntentId ?? null,
      patch.refundedAmountCents ?? null,
      patch.status ?? null,
      patch.failureMessage ?? null,
      now,
      id,
    )
    .run();
}

export function isRefundInProgressOrComplete(refund) {
  return Boolean(refund && TERMINAL_STATUSES.has(refund.status));
}
