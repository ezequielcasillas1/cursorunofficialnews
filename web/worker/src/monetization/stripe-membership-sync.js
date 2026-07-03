import { normalizeEmail, isValidEmail } from '../store/email-subscribers.js';
import { activateMember, getMember } from '../store/memberships.js';
import { getStripeClient, isStripeConfigured } from './stripe-client.js';

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

/** Pick the first billable subscription (matches stripe-webhook.js grace rules). */
export function pickActiveStripeSubscription(subscriptions) {
  for (const sub of subscriptions || []) {
    if (sub?.pause_collection) continue;
    if (ACTIVE_SUBSCRIPTION_STATUSES.has(sub?.status)) return sub;
  }
  return null;
}

function amountCentsFromSubscription(subscription) {
  const tierAmount = Number(subscription?.metadata?.tier_amount);
  if (Number.isFinite(tierAmount) && tierAmount > 0) {
    return Math.round(tierAmount * 100);
  }
  const unitAmount = subscription?.items?.data?.[0]?.price?.unit_amount;
  return Number.isFinite(unitAmount) ? unitAmount : null;
}

/**
 * When D1 is missing or stale, reconcile an active Stripe subscription into memberships.
 * Returns the activated member row, or null when Stripe has no active subscription.
 */
export async function syncActiveMembershipFromStripe(db, email, env) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized) || !isStripeConfigured(env)) {
    return null;
  }

  const stripe = getStripeClient(env);
  const customers = await stripe.customers.list({ email: normalized, limit: 10 });

  for (const customer of customers.data || []) {
    if (normalizeEmail(customer.email) !== normalized) continue;

    const { data: subscriptions } = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    });
    const subscription = pickActiveStripeSubscription(subscriptions);
    if (!subscription) continue;

    return activateMember(db, {
      email: normalized,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      amountCents: amountCentsFromSubscription(subscription),
    });
  }

  return null;
}

/**
 * Resolve an active membership for restore-access — D1 first, Stripe fallback.
 */
export async function resolveActiveMemberForClaim(db, email, env) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return null;

  const existing = await getMember(db, normalized);
  if (existing?.active) return existing;

  if (!isStripeConfigured(env)) {
    return existing?.active ? existing : null;
  }

  try {
    const synced = await syncActiveMembershipFromStripe(db, normalized, env);
    if (synced?.active) return synced;
  } catch (err) {
    console.error('[membership] Stripe sync failed during claim:', err.message || err);
  }

  return existing?.active ? existing : null;
}
