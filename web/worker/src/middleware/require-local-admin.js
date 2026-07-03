import { timingSafeEqualStrings } from '../lib/crypto.js';

function extractSecret(c) {
  const headerSecret = c.req.header('x-api-secret') || c.req.header('x-local-admin-secret');
  if (headerSecret) return headerSecret;
  const authHeader = c.req.header('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function isLocalHost(c) {
  const host = (c.req.header('host') || '').toLowerCase();
  return (
    host.startsWith('127.0.0.1') ||
    host.startsWith('localhost') ||
    host === '' // wrangler internal fetches
  );
}

export function isLocalAdminEnabled(env) {
  return env?.ENVIRONMENT !== 'production';
}

/**
 * Local-only admin guard. Returns 404 in production (route appears not to exist).
 * Requires LOCAL_ADMIN_SECRET or INGEST_SECRET + localhost Host in development.
 */
export async function requireLocalAdmin(c, next) {
  if (!isLocalAdminEnabled(c.env)) {
    return c.json({ error: 'Not found' }, 404);
  }

  if (!isLocalHost(c)) {
    return c.json({ error: 'Local admin is only available on localhost' }, 403);
  }

  const secret =
    c.env.LOCAL_ADMIN_SECRET?.trim() ||
    c.env.INGEST_SECRET?.trim();
  if (!secret) {
    return c.json(
      { error: 'Set LOCAL_ADMIN_SECRET or INGEST_SECRET in env/server/.env for local admin' },
      503,
    );
  }

  const provided = extractSecret(c);
  if (!provided || !timingSafeEqualStrings(provided, secret)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
}
