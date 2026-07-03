import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isNewsletterFreeEmail,
  resolveMembershipClaim,
} from './membership-entitlement.js';

describe('isNewsletterFreeEmail', () => {
  it('matches normalized addresses from NEWSLETTER_FREE_EMAILS', () => {
    const env = { NEWSLETTER_FREE_EMAILS: 'Owner@Example.com, other@test.com' };
    assert.equal(isNewsletterFreeEmail('owner@example.com', env), true);
    assert.equal(isNewsletterFreeEmail('other@test.com', env), true);
    assert.equal(isNewsletterFreeEmail('nobody@test.com', env), false);
  });
});

describe('resolveMembershipClaim', () => {
  it('returns newsletter entitlement for whitelisted email without active Stripe membership', async () => {
    const rows = new Map();
    const db = {
      prepare(sql) {
        const query = String(sql);
        return {
          bind(...params) {
            return {
              async first() {
                if (query.includes('FROM memberships WHERE email = ?')) {
                  return rows.get(params[0]) || null;
                }
                if (query.includes('FROM memberships WHERE membership_token = ?')) {
                  for (const row of rows.values()) {
                    if (row.membership_token === params[0]) return row;
                  }
                  return null;
                }
                return null;
              },
              async run() {
                if (query.startsWith('INSERT INTO memberships')) {
                  const record = {
                    email: params[0],
                    membership_token: params[1],
                    stripe_customer_id: params[2],
                    stripe_subscription_id: params[3],
                    amount_cents: params[4],
                    active: params[5],
                    status: params[6],
                    membership_started_at: params[7],
                    paused_at: params[8],
                    cancelled_at: params[9],
                    updated_at: params[10],
                  };
                  rows.set(record.email, record);
                }
                return { success: true };
              },
            };
          },
        };
      },
    };

    const env = {
      ENVIRONMENT: 'production',
      NEWSLETTER_FREE_EMAILS: '72afterda@gmail.com',
    };

    const claim = await resolveMembershipClaim(db, '72afterda@gmail.com', env);
    assert.ok(claim);
    assert.equal(claim.email, '72afterda@gmail.com');
    assert.equal(claim.newsletterUnlocked, true);
    assert.ok(claim.membershipToken);
  });
});
