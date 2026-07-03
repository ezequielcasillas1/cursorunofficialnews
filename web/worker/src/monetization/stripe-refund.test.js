import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isRefundEligible, MIN_REFUND_AMOUNT_CENTS } from '../monetization/stripe-refund.js';

describe('isRefundEligible', () => {
  it('requires $4+ amount_cents', () => {
    assert.equal(MIN_REFUND_AMOUNT_CENTS, 400);
    assert.deepEqual(isRefundEligible(null), {
      eligible: false,
      reason: 'Membership not found',
    });
    assert.equal(
      isRefundEligible({ stripeSubscriptionId: 'sub_1', amountCents: 300 }).eligible,
      false,
    );
    assert.equal(
      isRefundEligible({ stripeSubscriptionId: 'sub_1', amountCents: 400 }).eligible,
      true,
    );
    assert.equal(
      isRefundEligible({ stripeSubscriptionId: 'sub_1', amountCents: 500 }).eligible,
      true,
    );
  });

  it('requires a Stripe subscription id', () => {
    assert.equal(isRefundEligible({ amountCents: 500 }).eligible, false);
  });
});
