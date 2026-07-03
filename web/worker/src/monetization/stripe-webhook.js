import {
  activateMember,
  deactivateMember,
  getMemberByStripeCustomerId,
  pauseMember,
} from '../store/memberships.js';
import {
  getRefundByStripeRefundId,
  updateRefundStatus,
} from '../store/membership-refunds.js';
import { isValidEmail, normalizeEmail } from '../store/email-subscribers.js';
import { getStripeClient, getStripeCryptoProvider } from './stripe-client.js';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);
const ENDED_SUBSCRIPTION_STATUSES = new Set(['canceled', 'unpaid', 'incomplete_expired']);

function customerIdOf(customer) {
  return typeof customer === 'string' ? customer : customer?.id || null;
}

function amountCentsFromMetadata(metadata) {
  const tierAmount = Number(metadata?.tier_amount);
  return Number.isFinite(tierAmount) && tierAmount > 0 ? Math.round(tierAmount * 100) : null;
}

function amountCentsFromSession(session) {
  return amountCentsFromMetadata(session?.metadata) ?? session?.amount_total ?? null;
}

function amountCentsFromSubscription(subscription) {
  const fromMetadata = amountCentsFromMetadata(subscription?.metadata);
  if (fromMetadata !== null) return fromMetadata;
  const unitAmount = subscription?.items?.data?.[0]?.price?.unit_amount;
  return Number.isFinite(unitAmount) ? unitAmount : null;
}

/** Resolve the member's email for a subscription event — D1 first, Stripe as fallback. */
async function resolveEmailForCustomer(env, db, customerId) {
  const existing = await getMemberByStripeCustomerId(db, customerId);
  if (existing?.email) return existing.email;

  const stripe = getStripeClient(env);
  const customer = await stripe.customers.retrieve(customerId);
  const email = normalizeEmail(customer?.email || '');
  return isValidEmail(email) ? email : null;
}

async function handleCheckoutCompleted(c, event) {
  const db = c.env.DB;
  const session = event.data.object;
  if (session.mode !== 'subscription') {
    return { ok: true, ignored: true, reason: 'non-subscription checkout session' };
  }

  const email = normalizeEmail(session.customer_details?.email || session.customer_email || '');
  const customerId = customerIdOf(session.customer);
  const subscriptionId = customerIdOf(session.subscription) || session.subscription;

  if (!isValidEmail(email) || !customerId) {
    return { ok: true, ignored: true, reason: 'missing email or customer on checkout session' };
  }

  const member = await activateMember(db, {
    email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    amountCents: amountCentsFromSession(session),
  });

  return { ok: true, event: event.type, email: member.email, active: true, membershipStatus: 'active' };
}

async function handleSubscriptionUpdated(c, event) {
  const db = c.env.DB;
  const subscription = event.data.object;
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) {
    return { ok: true, ignored: true, reason: 'missing customer on subscription event' };
  }

  const email = await resolveEmailForCustomer(c.env, db, customerId);
  if (!email) {
    return { ok: true, ignored: true, reason: 'could not resolve member email from Stripe customer' };
  }

  if (ENDED_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    await deactivateMember(db, { email, stripeCustomerId: customerId });
    return { ok: true, event: event.type, email, active: false, membershipStatus: 'cancelled' };
  }

  // `pause_collection` is Stripe's native subscription pause — billing stops but the
  // subscription stays open, distinct from a full cancellation.
  if (subscription.pause_collection) {
    await pauseMember(db, { email, stripeCustomerId: customerId });
    return { ok: true, event: event.type, email, active: false, membershipStatus: 'paused' };
  }

  if (ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
    await activateMember(db, {
      email,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      amountCents: amountCentsFromSubscription(subscription),
    });
    return { ok: true, event: event.type, email, active: true, membershipStatus: 'active' };
  }

  // past_due / incomplete / etc. — grace period: lock entitlement, keep the row for recovery.
  await pauseMember(db, { email, stripeCustomerId: customerId });
  return { ok: true, event: event.type, email, active: false, membershipStatus: subscription.status };
}

async function handleSubscriptionDeleted(c, event) {
  const db = c.env.DB;
  const subscription = event.data.object;
  const customerId = customerIdOf(subscription.customer);
  if (!customerId) {
    return { ok: true, ignored: true, reason: 'missing customer on subscription event' };
  }

  const email = await resolveEmailForCustomer(c.env, db, customerId);
  if (!email) {
    return { ok: true, ignored: true, reason: 'could not resolve member email from Stripe customer' };
  }

  await deactivateMember(db, { email, stripeCustomerId: customerId });
  return { ok: true, event: event.type, email, active: false, membershipStatus: 'cancelled' };
}

async function handleChargeRefunded(c, event) {
  const db = c.env.DB;
  const charge = event.data.object;
  const refunds = charge.refunds?.data || [];
  const latestRefund = refunds[0];
  if (!latestRefund?.id) {
    return { ok: true, ignored: true, reason: 'no refund on charge event' };
  }

  const record = await getRefundByStripeRefundId(db, latestRefund.id);
  if (!record && charge.metadata?.subscription_id) {
    const email = charge.metadata.membership_email;
    if (email) {
      await deactivateMember(db, {
        email,
        stripeCustomerId: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
      });
    }
    return { ok: true, event: event.type, synced: 'deactivated_from_metadata' };
  }

  if (record) {
    await updateRefundStatus(db, record.id, {
      status: latestRefund.status === 'succeeded' ? 'succeeded' : record.status,
      refundedAmountCents: latestRefund.amount ?? charge.amount_refunded,
      stripeChargeId: charge.id,
    });
    if (latestRefund.status === 'succeeded') {
      await deactivateMember(db, {
        email: record.email,
        stripeCustomerId: record.stripeCustomerId,
      });
    }
  }

  return { ok: true, event: event.type, refundId: latestRefund.id, status: latestRefund.status };
}

async function handleRefundUpdated(c, event) {
  const db = c.env.DB;
  const refund = event.data.object;
  const record = await getRefundByStripeRefundId(db, refund.id);
  if (!record) {
    return { ok: true, ignored: true, reason: 'refund not tracked locally' };
  }

  const status = refund.status === 'succeeded' ? 'succeeded' : refund.status === 'failed' ? 'failed' : 'pending';
  await updateRefundStatus(db, record.id, {
    status,
    refundedAmountCents: refund.amount,
    failureMessage: refund.failure_reason || null,
  });

  if (status === 'succeeded') {
    await deactivateMember(db, {
      email: record.email,
      stripeCustomerId: record.stripeCustomerId,
    });
  }

  return { ok: true, event: event.type, refundId: refund.id, status };
}

/** Hono handler — expects the raw request body (registered before JSON body parsing). */
export async function handleStripeWebhook(c) {
  const env = c.env;
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret || !env.STRIPE_SECRET_KEY?.trim()) {
    return c.json({ error: 'Stripe webhook is not configured' }, 503);
  }

  const signature = c.req.header('stripe-signature') || '';
  const rawBody = await c.req.text();
  if (!rawBody) {
    return c.json({ error: 'Empty webhook body' }, 400);
  }

  let event;
  try {
    const stripe = getStripeClient(env);
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
      undefined,
      getStripeCryptoProvider(),
    );
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err.message || err);
    return c.json({ error: 'Invalid webhook signature' }, 401);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        return c.json(await handleCheckoutCompleted(c, event));
      case 'customer.subscription.updated':
        return c.json(await handleSubscriptionUpdated(c, event));
      case 'customer.subscription.deleted':
        return c.json(await handleSubscriptionDeleted(c, event));
      case 'charge.refunded':
        return c.json(await handleChargeRefunded(c, event));
      case 'refund.updated':
        return c.json(await handleRefundUpdated(c, event));
      default:
        return c.json({ ok: true, ignored: true, event: event.type });
    }
  } catch (err) {
    console.error(`[stripe/webhook] handler failed for ${event.type}:`, err.message || err);
    return c.json({ error: err.message || 'Webhook handler failed' }, 500);
  }
}
