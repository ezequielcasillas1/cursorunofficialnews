import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { recordAttempt, resetAllAttempts } from '../security/attempt-counter.js';
import { TURNSTILE_TEST_SECRET, TURNSTILE_TEST_SITE_KEY } from '../security/turnstile.js';
import {
  MEMBERSHIP_CLAIM_CAPTCHA_CODE,
  MEMBERSHIP_CLAIM_FREE_ATTEMPTS,
  resolveMembershipClaimGuard,
} from './membership-claim-guard.js';

const env = {
  ENVIRONMENT: 'development',
  TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
  TURNSTILE_SECRET: TURNSTILE_TEST_SECRET,
};

describe('resolveMembershipClaimGuard', () => {
  beforeEach(() => {
    resetAllAttempts();
  });

  it('allows the first ten restore attempts without a CAPTCHA', async () => {
    for (let i = 0; i < MEMBERSHIP_CLAIM_FREE_ATTEMPTS; i += 1) {
      const guard = await resolveMembershipClaimGuard({
        attemptKey: 'ip:member@example.com',
        env,
      });
      assert.equal(guard.ok, true);
      assert.equal(guard.captchaRequired, false);
      recordAttempt('ip:member@example.com');
    }
  });

  it('requires a CAPTCHA after ten attempts instead of cancelling', async () => {
    for (let i = 0; i < MEMBERSHIP_CLAIM_FREE_ATTEMPTS; i += 1) {
      recordAttempt('ip:member@example.com');
    }

    const missing = await resolveMembershipClaimGuard({
      attemptKey: 'ip:member@example.com',
      env,
    });
    assert.equal(missing.ok, false);
    assert.equal(missing.code, MEMBERSHIP_CLAIM_CAPTCHA_CODE);
    assert.equal(missing.captchaRequired, true);
    assert.equal(missing.siteKey, TURNSTILE_TEST_SITE_KEY);

    const passed = await resolveMembershipClaimGuard({
      attemptKey: 'ip:member@example.com',
      turnstileToken: 'ok-token',
      env,
      verify: async () => ({ ok: true }),
    });
    assert.equal(passed.ok, true);
    assert.equal(passed.captchaRequired, true);
  });

  it('never locks out when Turnstile is not configured', async () => {
    for (let i = 0; i < 20; i += 1) {
      recordAttempt('ip:open@example.com');
    }
    const guard = await resolveMembershipClaimGuard({
      attemptKey: 'ip:open@example.com',
      env: { ENVIRONMENT: 'production' },
    });
    assert.equal(guard.ok, true);
    assert.equal(guard.captchaRequired, false);
  });
});
