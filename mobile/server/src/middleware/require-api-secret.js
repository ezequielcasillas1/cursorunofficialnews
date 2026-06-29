import crypto from 'crypto';

function extractSecret(req) {
  const headerSecret = req.headers['x-api-secret'];
  if (headerSecret) return String(headerSecret);
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function checkSecret(req, expectedSecret) {
  const provided = extractSecret(req);
  if (!provided || !expectedSecret) return false;

  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expectedSecret);
  if (providedBuf.length !== expectedBuf.length) return false;

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Require INGEST_SECRET via X-API-Secret or Authorization: Bearer.
 * In production, INGEST_SECRET must be set. In dev, skips when unset.
 */
export function requireIngestSecret(req, res, next) {
  const secret = process.env.INGEST_SECRET?.trim();
  if (process.env.NODE_ENV === 'production' && !secret) {
    console.error('[auth] INGEST_SECRET is required in production');
    res.status(503).json({ error: 'Server misconfigured' });
    return;
  }
  if (!secret) {
    next();
    return;
  }
  if (!checkSecret(req, secret)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

/**
 * When REGISTER_SECRET is set, device register/unregister requires it.
 */
export function optionalRegisterSecret(req, res, next) {
  const secret = process.env.REGISTER_SECRET?.trim();
  if (!secret) {
    next();
    return;
  }
  if (!checkSecret(req, secret)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

/** Internal cron / bootstrap — pass secret from env without HTTP headers. */
export function getIngestSecretForInternal() {
  return process.env.INGEST_SECRET?.trim() || null;
}
