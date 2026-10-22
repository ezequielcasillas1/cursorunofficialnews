import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMembershipResumeNotice,
  currentPeriodEndIso,
  isMembershipResumable,
} from './stripe-membership-resume.js';

describe('isMembershipResumable', () => {
  it('requires an active Stripe membership and open subscription', () => {
    assert.equal(isMembershipResumable(null, {}).resumable, false);
    assert.equal(
      isMembershipResumable({ active: true, email: 'a@b.com' }, { status: 'active' }).resumable,
      false,
    );
    assert.equal(
      isMembershipResumable(
        { active: true, email: 'a@b.com', stripeSubscriptionId: 'sub_1' },
        { status: 'canceled', cancel_at_period_end: false },
      ).code,
      'ENDED',
    );
  });

  it('treats scheduled cancel as resumable and active renewing as already resumed', () => {
    const member = { active: true, email: 'a@b.com', stripeSubscriptionId: 'sub_1' };
    assert.deepEqual(isMembershipResumable(member, { status: 'active', cancel_at_period_end: true }), {
      resumable: true,
      alreadyResumed: false,
      email: 'a@b.com',
    });
    assert.equal(
      isMembershipResumable(member, { status: 'active', cancel_at_period_end: false }).alreadyResumed,
      true,
    );
  });
});

describe('buildMembershipResumeNotice', () => {
  it('names the next renewal date', () => {
    const notice = buildMembershipResumeNotice({
      email: 'member@example.com',
      currentPeriodEnd: '2026-09-16T00:00:00.000Z',
    });
    assert.equal(notice.headline, 'Membership resumed');
    assert.match(notice.summary, /September 16, 2026/);
    assert.equal(notice.alreadyResumed, false);
  });
});

describe('currentPeriodEndIso', () => {
  it('reads period end from the subscription or its first item', () => {
    assert.equal(currentPeriodEndIso(null), null);
    assert.equal(
      currentPeriodEndIso({ current_period_end: 1750000000 }),
      new Date(1750000000 * 1000).toISOString(),
    );
    assert.equal(
      currentPeriodEndIso({ items: { data: [{ current_period_end: 1750000000 }] } }),
      new Date(1750000000 * 1000).toISOString(),
    );
  });
});
