import Stripe from 'stripe';

/**
 * Cloudflare Workers has no Node `http`/`crypto` — the `stripe` package needs
 * an explicit fetch-based HTTP client and a Web Crypto provider for webhook
 * signature verification (`constructEventAsync`, not the sync `constructEvent`).
 */

export function isStripeConfigured(env) {
  return Boolean(env?.STRIPE_SECRET_KEY?.trim());
}

/** Dev/diagnostic: which membership Checkout env vars are set (never returns secret values). */
export function getStripeMembershipConfigStatus(env) {
  const missingPriceIds = [1, 2, 3, 4, 5].filter(
    (tier) => !env?.[`STRIPE_PRICE_ID_${tier}`]?.trim(),
  );
  return {
    secretKeyConfigured: Boolean(env?.STRIPE_SECRET_KEY?.trim()),
    webhookSecretConfigured: Boolean(env?.STRIPE_WEBHOOK_SECRET?.trim()),
    missingPriceIds,
    fullyConfigured:
      Boolean(env?.STRIPE_SECRET_KEY?.trim()) && missingPriceIds.length === 0,
  };
}

export function getStripeClient(env) {
  const secretKey = env?.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error('Stripe is not configured — set STRIPE_SECRET_KEY');
  }
  return new Stripe(secretKey, {
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export function getStripeCryptoProvider() {
  return Stripe.createSubtleCryptoProvider();
}
