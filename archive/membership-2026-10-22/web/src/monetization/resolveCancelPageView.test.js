import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCancelPageView } from './resolveCancelPageView.js';

test('shows restore when there is no membership token', () => {
  assert.equal(
    resolveCancelPageView({
      checking: false,
      hasEntitlement: true,
      hasToken: false,
      cancelEligibility: null,
    }),
    'restore',
  );
});

test('shows loading only after a token exists', () => {
  assert.equal(
    resolveCancelPageView({
      checking: false,
      hasEntitlement: true,
      hasToken: true,
      cancelEligibility: null,
    }),
    'loading',
  );
});

test('shows error instead of spinning when eligibility failed', () => {
  assert.equal(
    resolveCancelPageView({
      checking: false,
      hasEntitlement: true,
      hasToken: true,
      cancelEligibility: { cancellable: false, loadError: true, error: 'timeout' },
    }),
    'error',
  );
});

test('shows cancel when Stripe eligibility says cancellable', () => {
  assert.equal(
    resolveCancelPageView({
      checking: false,
      hasEntitlement: true,
      hasToken: true,
      cancelEligibility: { cancellable: true, hasStripeSubscription: true },
    }),
    'cancel',
  );
});
