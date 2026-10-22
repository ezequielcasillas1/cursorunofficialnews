import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMembershipClaimChallenge } from './resolveMembershipClaimChallenge.js';

test('ignores ordinary claim errors', () => {
  assert.deepEqual(resolveMembershipClaimChallenge({ message: 'Too many requests' }), {
    captchaRequired: false,
    siteKey: '',
    error: 'Too many requests',
  });
});

test('surfaces CAPTCHA_REQUIRED with the site key', () => {
  assert.deepEqual(
    resolveMembershipClaimChallenge({
      code: 'CAPTCHA_REQUIRED',
      siteKey: '1x00000000000000000000AA',
      message: 'Complete the CAPTCHA to send another restore link.',
    }),
    {
      captchaRequired: true,
      siteKey: '1x00000000000000000000AA',
      error: 'Complete the CAPTCHA to send another restore link.',
    },
  );
});
