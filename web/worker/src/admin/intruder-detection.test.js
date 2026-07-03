import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCESS_SOURCES,
  classifyMemberAccess,
  findIntruderCandidates,
} from './intruder-detection.js';

const baseEnv = {
  ENVIRONMENT: 'development',
  MEMBERSHIP_GRANDFATHER_EMAILS: 'early@example.com',
  MEMBERSHIP_GRANDFATHER_BEFORE: '2026-06-01T00:00:00.000Z',
  NEWSLETTER_FREE_EMAILS: 'free@example.com',
  MEMBERSHIP_DEV_EMAILS: 'dev@example.com',
};

describe('classifyMemberAccess', () => {
  it('treats Stripe subscription as legitimate', () => {
    const result = classifyMemberAccess(
      {
        email: 'paid@example.com',
        active: true,
        stripeSubscriptionId: 'sub_123',
        membershipStartedAt: '2026-07-15T00:00:00.000Z',
      },
      baseEnv,
    );
    assert.equal(result.isIntruder, false);
    assert.equal(result.accessSource, ACCESS_SOURCES.STRIPE);
  });

  it('grandfathers explicit email allowlist', () => {
    const result = classifyMemberAccess(
      {
        email: 'early@example.com',
        active: true,
        membershipStartedAt: '2026-07-15T00:00:00.000Z',
      },
      baseEnv,
    );
    assert.equal(result.isIntruder, false);
    assert.equal(result.isGrandfathered, true);
    assert.equal(result.accessSource, ACCESS_SOURCES.GRANDFATHER_EMAIL);
  });

  it('grandfathers members before cutoff date', () => {
    const result = classifyMemberAccess(
      {
        email: 'legacy@example.com',
        active: true,
        membershipStartedAt: '2026-05-15T00:00:00.000Z',
      },
      baseEnv,
    );
    assert.equal(result.isIntruder, false);
    assert.equal(result.accessSource, ACCESS_SOURCES.GRANDFATHER_DATE);
  });

  it('flags active member with no Stripe proof as intruder', () => {
    const result = classifyMemberAccess(
      {
        email: 'hacker@example.com',
        active: true,
        membershipStartedAt: '2026-07-15T00:00:00.000Z',
      },
      baseEnv,
    );
    assert.equal(result.isIntruder, true);
    assert.equal(result.accessSource, ACCESS_SOURCES.UNKNOWN);
  });

  it('respects manual allow override', () => {
    const result = classifyMemberAccess(
      {
        email: 'hacker@example.com',
        active: true,
        membershipStartedAt: '2026-07-15T00:00:00.000Z',
      },
      baseEnv,
      { overrideStatus: 'allow' },
    );
    assert.equal(result.isIntruder, false);
    assert.equal(result.accessSource, ACCESS_SOURCES.MANUAL_ALLOW);
  });
});

describe('findIntruderCandidates', () => {
  it('returns only active non-grandfathered members', () => {
    const members = [
      { email: 'early@example.com', active: true, membershipStartedAt: '2026-07-15T00:00:00.000Z' },
      { email: 'hacker@example.com', active: true, membershipStartedAt: '2026-07-15T00:00:00.000Z' },
      { email: 'paid@example.com', active: true, stripeSubscriptionId: 'sub_1' },
    ];
    const intruders = findIntruderCandidates(members, baseEnv);
    assert.equal(intruders.length, 1);
    assert.equal(intruders[0].member.email, 'hacker@example.com');
  });
});
