import { timingSafeEqualStrings } from '../lib/crypto.js';

function extractSecret(c) {
  const headerSecret = c.req.header('x-api-secret');
  if (headerSecret) return headerSecret;
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function checkSecret(c, expectedSecret) {
  const provided = extractSecret(c);
  if (!provided || !expectedSecret) return false;
  return timingSafeEqualStrings(provided, expectedSecret);
}

/**
 * Require INGEST_SECRET via X-API-Secret or Authorization: Bearer.
 * In production, INGEST_SECRET must be set. In dev, skips when unset.
 */
export async function requireIngestSecret(c, next) {
  const secret = c.env.INGEST_SECRET?.trim();
  if (c.env.ENVIRONMENT === 'production' && !secret) {
    console.error('[auth] INGEST_SECRET is required in production');
    return c.json({ error: 'Server misconfigured' }, 503);
  }
  if (!secret) {
    await next();
    return;
  }
  if (!checkSecret(c, secret)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
}

/**
 * Device register/unregister auth (mobile push only — not used by the website).
 * When REGISTER_SECRET is unset, push registration is disabled (503).
 * Website-only deploys can omit this secret; news, membership, email, and Stripe
 * flows are unaffected.
 */
export async function optionalRegisterSecret(c, next) {
  const secret = c.env.REGISTER_SECRET?.trim();
  if (!secret) {
    if (c.env.ENVIRONMENT === 'production') {
      return c.json({ error: 'Push device registration is not enabled' }, 503);
    }
    await next();
    return;
  }
  if (!checkSecret(c, secret)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
}
