/** Adapter for Cloudflare Turnstile siteverify. */

export const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_SECRET = '1x0000000000000000000000000000000AA';

export function getTurnstileSiteKey(env) {
  const configured = String(env?.TURNSTILE_SITE_KEY || '').trim();
  if (configured) return configured;
  if (env?.ENVIRONMENT !== 'production') return TURNSTILE_TEST_SITE_KEY;
  return '';
}

export function getTurnstileSecret(env) {
  const configured = String(env?.TURNSTILE_SECRET || env?.TURNSTILE_SECRET_KEY || '').trim();
  if (configured) return configured;
  if (env?.ENVIRONMENT !== 'production') return TURNSTILE_TEST_SECRET;
  return '';
}

export function isTurnstileConfigured(env) {
  return Boolean(getTurnstileSecret(env) && getTurnstileSiteKey(env));
}

function allowedHostnames(env) {
  const explicit = String(env?.TURNSTILE_HOSTNAMES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (explicit.length) return explicit;
  try {
    const webBase = String(env?.PUBLIC_WEB_BASE || '').trim();
    if (webBase) return [new URL(webBase).hostname];
  } catch {
    /* ignore invalid PUBLIC_WEB_BASE */
  }
  return [];
}

/**
 * @param {{ token: string, ip?: string, env?: Record<string, unknown>, expectedAction?: string }} input
 */
export async function verifyTurnstileToken({ token, ip, env, expectedAction = 'membership-claim' }) {
  const secret = getTurnstileSecret(env);
  if (!secret) return { ok: true, skipped: true };

  const response = String(token || '').trim();
  if (!response) return { ok: false, reason: 'missing' };

  let result;
  try {
    const res = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({
        secret,
        response,
        remoteip: ip || '',
      }),
    });
    if (!res.ok) return { ok: false, reason: 'http' };
    result = await res.json();
  } catch {
    return { ok: false, reason: 'network' };
  }

  if (!result?.success) return { ok: false, reason: 'failed' };
  if (result.action && expectedAction && result.action !== expectedAction) {
    return { ok: false, reason: 'action' };
  }

  if (secret !== TURNSTILE_TEST_SECRET) {
    const allowed = allowedHostnames(env);
    if (allowed.length && result.hostname && !allowed.includes(result.hostname)) {
      return { ok: false, reason: 'hostname' };
    }
  }

  return { ok: true };
}
