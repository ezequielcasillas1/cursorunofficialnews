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

/** D1-only / local-dev rows are active but have no Stripe subscription id — still ask Stripe. */
export function shouldReconcileMembershipWithStripe(member) {
  return !member?.active || !member?.stripeSubscriptionId;
}

/**
 * Paid membership in production is Stripe-backed. Local-dev D1-only rows may stay active.
 */
export function isPaidMembershipRecord(member, env) {
  if (!member?.active) return false;
  if (member.stripeSubscriptionId) return true;
  return env?.ENVIRONMENT !== 'production';
}

/**
 * Look up a Stripe customer + active subscription for any email.
 * Reuses the first matching customer when the subscription is already cancelled.
 */
export async function findActiveStripeBilling(env, email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized) || !isStripeConfigured(env)) {
    return { customer: null, subscription: null };
  }

  const stripe = getStripeClient(env);
  const customers = await stripe.customers.list({ email: normalized, limit: 10 });
  let reusableCustomer = null;

  for (const customer of customers.data || []) {
    if (customer?.deleted) continue;
    if (normalizeEmail(customer.email) !== normalized) continue;

    const { data: subscriptions } = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 10,
    });
    const subscription = pickActiveStripeSubscription(subscriptions);
    if (subscription) {
      return { customer, subscription };
    }
    if (!reusableCustomer) reusableCustomer = customer;
  }

  return { customer: reusableCustomer, subscription: null };
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

  const { customer, subscription } = await findActiveStripeBilling(env, normalized);
  if (!customer || !subscription) return null;

  return activateMember(db, {
    email: normalized,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: subscription.id,
    amountCents: amountCentsFromSubscription(subscription),
  });
}

/**
 * Resolve an active membership for restore-access — D1 first, Stripe fallback.
 * Production never treats a D1-only whitelist row as a paid subscription.
 */
export async function resolveActiveMemberForClaim(db, email, env) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) return null;

  const existing = await getMember(db, normalized);
  if (!shouldReconcileMembershipWithStripe(existing)) return existing;

  if (!isStripeConfigured(env)) {
    return isPaidMembershipRecord(existing, env) ? existing : null;
  }

  try {
    const synced = await syncActiveMembershipFromStripe(db, normalized, env);
    if (synced?.active) return synced;
  } catch (err) {
    console.error('[membership] Stripe sync failed during claim:', err.message || err);
  }

  return isPaidMembershipRecord(existing, env) ? existing : null;
}
