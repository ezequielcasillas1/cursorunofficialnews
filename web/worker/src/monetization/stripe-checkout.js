import { getPublicWebBase } from '../lib/env.js';
import { getStripeClient } from './stripe-client.js';

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

/** Creates a Stripe Checkout Session for a $1–$5/mo membership subscription. */
export async function createMembershipCheckoutSession(env, { amount, email } = {}) {
  const tier = normalizeTierAmount(amount);
  const priceId = getPriceIdForAmount(tier, env);
  const stripe = getStripeClient(env);
  const webBase = getPublicWebBase(env).replace(/\/$/, '');

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${webBase}/?membership_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${webBase}/?membership_cancelled=1`,
    customer_email: email || undefined,
    // Stored on both the session and the resulting subscription so webhook
    // handlers never have to reverse-engineer the tier from unit_amount.
    subscription_data: { metadata: { tier_amount: String(tier) } },
    metadata: { tier_amount: String(tier) },
  });

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
