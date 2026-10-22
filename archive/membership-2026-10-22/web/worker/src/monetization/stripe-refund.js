import { getStripeClient } from './stripe-client.js';
import { deactivateMember, getMemberByToken } from '../store/memberships.js';
import {
  createRefundRequest,
  getRefundByIdempotencyKey,
  getRefundBySubscriptionId,
  isRefundInProgressOrComplete,
  updateRefundStatus,
} from '../store/membership-refunds.js';

/** Refunds are offered for $4/mo and $5/mo memberships only. */
export const MIN_REFUND_AMOUNT_CENTS = 400;

export function isRefundEligible(member) {
  if (!member) {
    return { eligible: false, reason: 'Membership not found' };
  }
  if (!member.stripeSubscriptionId) {
    return { eligible: false, reason: 'No billable subscription on file for this membership' };
  }
  const amountCents = member.amountCents ?? 0;
  if (amountCents < MIN_REFUND_AMOUNT_CENTS) {
    return {
      eligible: false,
      reason: 'Refunds are available for $4/mo and $5/mo memberships only',
      amountCents,
      minAmountCents: MIN_REFUND_AMOUNT_CENTS,
    };
  }
  return { eligible: true, amountCents, minAmountCents: MIN_REFUND_AMOUNT_CENTS };
}

async function resolveLatestPaidCharge(stripe, subscriptionId) {
  const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
    status: 'paid',
    limit: 1,
  });
  const invoice = invoices.data[0];
  if (!invoice) {
    throw new Error('No paid invoice found for this subscription');
  }

  if (invoice.charge) {
    const chargeId = typeof invoice.charge === 'string' ? invoice.charge : invoice.charge?.id;
    if (chargeId) {
      return {
        chargeId,
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        paymentIntentId: null,
      };
    }
  }

  const paymentIntentId =
    typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id;
  if (paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const chargeId =
      typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id;
    if (chargeId) {
      return {
        chargeId,
        invoiceId: invoice.id,
        amountPaid: invoice.amount_paid,
        paymentIntentId,
      };
    }
  }

  throw new Error('Could not resolve a charge to refund for this subscription');
}

function buildIdempotencyKey(subscriptionId) {
  return `membership-refund/${subscriptionId}`;
}

export async function getMembershipRefundEligibility(db, membershipToken) {
  const token = String(membershipToken || '').trim();
  if (!token) {
    return { eligible: false, reason: 'token is required' };
  }

  const member = await getMemberByToken(db, token);
  const eligibility = isRefundEligible(member);
  if (!eligibility.eligible) {
    return { ...eligibility, email: member?.email || null };
  }

  const existing = await getRefundBySubscriptionId(db, member.stripeSubscriptionId);
  if (existing?.status === 'succeeded') {
    return {
      eligible: false,
      reason: 'This membership has already been refunded',
      alreadyRefunded: true,
      email: member.email,
    };
  }
  if (existing?.status === 'pending') {
    return {
      eligible: false,
      reason: 'A refund is already being processed for this membership',
      pending: true,
      email: member.email,
    };
  }

  return {
    eligible: true,
    amountCents: eligibility.amountCents,
    minAmountCents: MIN_REFUND_AMOUNT_CENTS,
    email: member.email,
    policy: 'full_refund_latest_invoice',
  };
}

/** Full refund of the latest paid invoice + immediate subscription cancel. */
export async function processMembershipRefund(env, db, { membershipToken } = {}) {
  const token = String(membershipToken || '').trim();
  if (!token) {
    throw new Error('membershipToken is required');
  }

  const member = await getMemberByToken(db, token);
  const eligibility = isRefundEligible(member);
  if (!eligibility.eligible) {
    const err = new Error(eligibility.reason);
    err.code = 'NOT_ELIGIBLE';
    throw err;
  }

  const idempotencyKey = buildIdempotencyKey(member.stripeSubscriptionId);
  const existingByKey = await getRefundByIdempotencyKey(db, idempotencyKey);
  if (existingByKey?.status === 'succeeded') {
    const err = new Error('This membership has already been refunded');
    err.code = 'ALREADY_REFUNDED';
    throw err;
  }
  if (existingByKey?.status === 'pending') {
    return {
      ok: true,
      pending: true,
      refundId: existingByKey.stripeRefundId,
      status: 'pending',
      amountCents: existingByKey.amountCents,
      email: member.email,
    };
  }

  const existing = await getRefundBySubscriptionId(db, member.stripeSubscriptionId);
  if (isRefundInProgressOrComplete(existing)) {
    if (existing.status === 'succeeded') {
      const err = new Error('This membership has already been refunded');
      err.code = 'ALREADY_REFUNDED';
      throw err;
    }
    return {
      ok: true,
      pending: true,
      refundId: existing.stripeRefundId,
      status: 'pending',
      amountCents: existing.amountCents,
      email: member.email,
    };
  }

  const auditRecord = await createRefundRequest(db, {
    email: member.email,
    stripeCustomerId: member.stripeCustomerId,
    stripeSubscriptionId: member.stripeSubscriptionId,
    amountCents: eligibility.amountCents,
    idempotencyKey,
    reason: 'requested_by_customer',
  });

  const stripe = getStripeClient(env);

  try {
    const { chargeId, invoiceId, amountPaid, paymentIntentId } = await resolveLatestPaidCharge(
      stripe,
      member.stripeSubscriptionId,
    );

    const refund = await stripe.refunds.create(
      {
        charge: chargeId,
        reason: 'requested_by_customer',
        metadata: {
          membership_email: member.email,
          subscription_id: member.stripeSubscriptionId,
        },
      },
      { idempotencyKey },
    );

    try {
      await stripe.subscriptions.cancel(member.stripeSubscriptionId);
    } catch (cancelErr) {
      console.warn('[stripe/refund] subscription cancel:', cancelErr.message || cancelErr);
    }

    await deactivateMember(db, {
      email: member.email,
      stripeCustomerId: member.stripeCustomerId,
    });

    const refundStatus = refund.status === 'succeeded' ? 'succeeded' : 'pending';
    await updateRefundStatus(db, auditRecord.id, {
      status: refundStatus,
      stripeRefundId: refund.id,
      stripeChargeId: chargeId,
      stripeInvoiceId: invoiceId,
      stripePaymentIntentId: paymentIntentId,
      refundedAmountCents: refund.amount ?? amountPaid,
    });

    return {
      ok: true,
      refundId: refund.id,
      status: refund.status,
      amountCents: refund.amount ?? amountPaid,
      email: member.email,
      membershipStatus: 'cancelled',
    };
  } catch (err) {
    await updateRefundStatus(db, auditRecord.id, {
      status: 'failed',
      failureMessage: err.message || 'Refund failed',
    });
    throw err;
  }
}
