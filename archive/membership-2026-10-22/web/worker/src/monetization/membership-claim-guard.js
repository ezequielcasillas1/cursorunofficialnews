import { peekAttemptCount } from '../security/attempt-counter.js';
import {
  getTurnstileSiteKey,
  isTurnstileConfigured,
  verifyTurnstileToken,
} from '../security/turnstile.js';

/** First 10 restore sends are free; the 11th and later require CAPTCHA. Never hard-blocks. */
export const MEMBERSHIP_CLAIM_FREE_ATTEMPTS = 10;
export const MEMBERSHIP_CLAIM_CAPTCHA_CODE = 'CAPTCHA_REQUIRED';
export const MEMBERSHIP_CLAIM_CAPTCHA_MESSAGE =
  'Complete the CAPTCHA to send another restore link.';

function allowStrategy() {
  return { ok: true, captchaRequired: false };
}

function captchaRequiredStrategy(siteKey, error) {
  return {
    ok: false,
    captchaRequired: true,
    code: MEMBERSHIP_CLAIM_CAPTCHA_CODE,
    siteKey,
    error,
  };
}

/**
 * Strategy: allow vs CAPTCHA-required. Missing Turnstile config never locks the user out.
 */
export async function resolveMembershipClaimGuard({
  attemptKey,
  turnstileToken,
  ip,
  env,
  verify = verifyTurnstileToken,
}) {
  const count = peekAttemptCount(attemptKey);
  if (count < MEMBERSHIP_CLAIM_FREE_ATTEMPTS) {
    return allowStrategy();
  }

  const siteKey = getTurnstileSiteKey(env);
  if (!isTurnstileConfigured(env) || !siteKey) {
    return allowStrategy();
  }

  const token = String(turnstileToken || '').trim();
  if (!token) {
    return captchaRequiredStrategy(siteKey, MEMBERSHIP_CLAIM_CAPTCHA_MESSAGE);
  }

  const verified = await verify({
    token,
    ip,
    env,
    expectedAction: 'membership-claim',
  });
  if (!verified.ok) {
    return captchaRequiredStrategy(siteKey, 'CAPTCHA verification failed. Please try again.');
  }

  return { ok: true, captchaRequired: true };
}
