import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isMembershipCancellable } from './stripe-membership-cancel.js';

describe('isMembershipCancellable', () => {
  it('requires an active membership', () => {
    assert.deepEqual(isMembershipCancellable(null), {
      cancellable: false,
      reason: 'Membership not found',
    });
    assert.deepEqual(
      isMembershipCancellable({ active: false, status: 'cancelled' }),
      {
        cancellable: false,
        reason: 'This membership is not active',
        membershipStatus: 'cancelled',
      },
    );
  });

  it('allows active Stripe and non-Stripe memberships', () => {
    assert.deepEqual(isMembershipCancellable({ active: true, email: 'a@b.com' }), {
      cancellable: true,
      hasStripeSubscription: false,
      email: 'a@b.com',
    });
    assert.deepEqual(
      isMembershipCancellable({
        active: true,
        email: 'a@b.com',
        stripeSubscriptionId: 'sub_1',
      }),
      {
        cancellable: true,
        hasStripeSubscription: true,
        email: 'a@b.com',
      },
    );
  });
});
