import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMembershipCheckout } from './resolveMembershipCheckout.js';

const ALLOWED = [1, 2, 3, 4, 5];

test('requires an email before checkout', () => {
  assert.deepEqual(
    resolveMembershipCheckout({ email: '  ', amount: 1, allowedAmounts: ALLOWED }),
    { ok: false, error: 'Enter the email that will own this membership' },
  );
});

test('rejects an invalid email', () => {
  assert.deepEqual(
    resolveMembershipCheckout({ email: 'not-an-email', amount: 2, allowedAmounts: ALLOWED }),
    { ok: false, error: 'Enter a valid email address' },
  );
});

test('requires a listed monthly amount', () => {
  assert.deepEqual(
    resolveMembershipCheckout({
      email: 'member@example.com',
      amount: 9,
      allowedAmounts: ALLOWED,
    }),
    { ok: false, error: 'Choose a monthly amount' },
  );
});

test('returns trimmed email and selected amount', () => {
  assert.deepEqual(
    resolveMembershipCheckout({
      email: '  member@example.com  ',
      amount: 3,
      allowedAmounts: ALLOWED,
    }),
    { ok: true, email: 'member@example.com', amount: 3 },
  );
});
