import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPaidMembershipRecord,
  pickActiveStripeSubscription,
  shouldReconcileMembershipWithStripe,
} from './stripe-membership-sync.js';

describe('pickActiveStripeSubscription', () => {
  it('returns active or trialing subscriptions that are not paused', () => {
    const picked = pickActiveStripeSubscription([
      { id: 'sub_paused', status: 'active', pause_collection: { behavior: 'void' } },
      { id: 'sub_active', status: 'active' },
    ]);
    assert.equal(picked?.id, 'sub_active');
  });

  it('accepts trialing subscriptions', () => {
    const picked = pickActiveStripeSubscription([{ id: 'sub_trial', status: 'trialing' }]);
    assert.equal(picked?.id, 'sub_trial');
  });

  it('reconciles local-dev members that have no Stripe subscription id', () => {
    assert.equal(shouldReconcileMembershipWithStripe(null), true);
    assert.equal(shouldReconcileMembershipWithStripe({ active: true }), true);
    assert.equal(
      shouldReconcileMembershipWithStripe({ active: true, stripeSubscriptionId: 'sub_1' }),
      false,
    );
    assert.equal(
      shouldReconcileMembershipWithStripe({ active: false, stripeSubscriptionId: 'sub_1' }),
      true,
    );
  });

  it('treats production D1-only rows as unpaid', () => {
    const localOnly = { active: true, email: 'owner@example.com' };
    assert.equal(isPaidMembershipRecord(localOnly, { ENVIRONMENT: 'production' }), false);
    assert.equal(isPaidMembershipRecord(localOnly, { ENVIRONMENT: 'development' }), true);
    assert.equal(
      isPaidMembershipRecord(
        { active: true, stripeSubscriptionId: 'sub_1' },
        { ENVIRONMENT: 'production' },
      ),
      true,
    );
  });

  it('ignores cancelled or past_due subscriptions', () => {
    const picked = pickActiveStripeSubscription([
      { id: 'sub_cancelled', status: 'canceled' },
      { id: 'sub_past_due', status: 'past_due' },
    ]);
    assert.equal(picked, null);
  });
});
