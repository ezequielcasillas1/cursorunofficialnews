import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickActiveStripeSubscription } from './stripe-membership-sync.js';

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

  it('ignores cancelled or past_due subscriptions', () => {
    const picked = pickActiveStripeSubscription([
      { id: 'sub_cancelled', status: 'canceled' },
      { id: 'sub_past_due', status: 'past_due' },
    ]);
    assert.equal(picked, null);
  });
});
