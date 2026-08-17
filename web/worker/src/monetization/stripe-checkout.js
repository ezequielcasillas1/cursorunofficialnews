import { getPublicWebBase } from '../lib/env.js';
import { isValidEmail, normalizeEmail } from '../store/email-subscribers.js';
import { getStripeClient } from './stripe-client.js';
import { isMembershipBillingOffline, MEMBERSHIP_BILLING_OFFLINE_ERROR } from './membership-offline.js';
import { findActiveStripeBilling } from './stripe-membership-sync.js';

/** Fixed monthly tiers — mirrors the discrete Stripe Prices created for the membership Product. */
export const MEMBERSHIP_TIER_AMOUNTS = [1, 2, 3, 4, 5];

export function normalizeTierAmount(amount) {
  const parsed = Number(amount);
  if (!MEMBERSHIP_TIER_AMOUNTS.includes(parsed)) {
    throw new Error(`amount must be one of $${MEMBERSHIP_TIER_AMOUNTS.join(', $')} per month`);
  }
  return parsed;
}

function getPriceIdForAmount(amount, env) {
  const priceId = env?.[`STRIPE_PRICE_ID_${amount}`]?.trim();
  if (!priceId) {
    throw new Error(`Membership is not configured for $${amount}/mo yet — missing STRIPE_PRICE_ID_${amount}`);
  }
  return priceId;
}

export function alreadySubscribedError(email) {
  const err = new Error(
    'This email already has an active membership. Restore access on this device instead of starting a new checkout.',
  );
  err.code = 'ALREADY_SUBSCRIBED';
  err.email = email;
  return err;
}

/** Checkout params for any paying email — reuse Stripe customer when one exists. */
export function buildMembershipCheckoutSessionParams({
  webBase,
  priceId,
  tier,
  email,
  customerId,
}) {
  const params = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webBase}/?membership_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webBase}/?membership_cancelled=1`,
    subscription_data: { metadata: { tier_amount: String(tier) } },
    metadata: {
      tier_amount: String(tier),
      membership_email: email,
    },
  };

  if (customerId) {
    params.customer = customerId;
  } else {
    params.customer_email = email;
  }

  return params;
}

/** Creates a Stripe Checkout Session for a $1–$5/mo membership subscription. */
export async function createMembershipCheckoutSession(env, { amount, email } = {}) {
  if (isMembershipBillingOffline(env)) {
    throw new Error(MEMBERSHIP_BILLING_OFFLINE_ERROR);
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Enter a valid email address');
  }

  const tier = normalizeTierAmount(amount);
  const priceId = getPriceIdForAmount(tier, env);
  const stripe = getStripeClient(env);
  const webBase = getPublicWebBase(env).replace(/\/$/, '');
  const billing = await findActiveStripeBilling(env, normalizedEmail);
  if (billing.subscription) {
    throw alreadySubscribedError(normalizedEmail);
  }

  const session = await stripe.checkout.sessions.create(
    buildMembershipCheckoutSessionParams({
      webBase,
      priceId,
      tier,
      email: normalizedEmail,
      customerId: billing.customer?.id || null,
    }),
  );

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return { url: session.url, sessionId: session.id };
}

/** Retrieves a Checkout Session with subscription/customer expanded for the confirm step. */
export async function retrieveCompletedCheckoutSession(env, sessionId) {
  const stripe = getStripeClient(env);
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  });
}
