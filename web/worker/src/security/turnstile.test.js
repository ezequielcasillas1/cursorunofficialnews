import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTurnstileSecret,
  getTurnstileSiteKey,
  isTurnstileConfigured,
  TURNSTILE_TEST_SECRET,
  TURNSTILE_TEST_SITE_KEY,
  verifyTurnstileToken,
} from './turnstile.js';

describe('turnstile adapter', () => {
  it('uses Cloudflare dummy keys outside production when unset', () => {
    const env = { ENVIRONMENT: 'development' };
    assert.equal(getTurnstileSiteKey(env), TURNSTILE_TEST_SITE_KEY);
    assert.equal(getTurnstileSecret(env), TURNSTILE_TEST_SECRET);
    assert.equal(isTurnstileConfigured(env), true);
  });

  it('does not invent keys in production', () => {
    const env = { ENVIRONMENT: 'production' };
    assert.equal(getTurnstileSiteKey(env), '');
    assert.equal(getTurnstileSecret(env), '');
    assert.equal(isTurnstileConfigured(env), false);
  });

  it('skips verify when no secret is configured', async () => {
    const result = await verifyTurnstileToken({
      token: '',
      env: { ENVIRONMENT: 'production' },
    });
    assert.deepEqual(result, { ok: true, skipped: true });
  });

  it('rejects a missing token when a secret is set', async () => {
    const result = await verifyTurnstileToken({
      token: '  ',
      env: { ENVIRONMENT: 'production', TURNSTILE_SECRET: 'secret', TURNSTILE_SITE_KEY: 'site' },
    });
    assert.deepEqual(result, { ok: false, reason: 'missing' });
  });
});
