import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isNewsletterFreeEmail,
  resolveMembershipClaim,
} from './membership-entitlement.js';

function createMembershipDb(initialRows = []) {
  const rows = new Map(initialRows.map((row) => [row.email, row]));
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
  return { db, rows };
}

describe('isNewsletterFreeEmail', () => {
  it('matches normalized addresses from NEWSLETTER_FREE_EMAILS', () => {
    const env = { NEWSLETTER_FREE_EMAILS: 'Owner@Example.com, other@test.com' };
    assert.equal(isNewsletterFreeEmail('owner@example.com', env), true);
    assert.equal(isNewsletterFreeEmail('other@test.com', env), true);
    assert.equal(isNewsletterFreeEmail('nobody@test.com', env), false);
  });
});

describe('resolveMembershipClaim', () => {
  it('does not mint paid membership from NEWSLETTER_FREE_EMAILS in production', async () => {
    const { db, rows } = createMembershipDb();
    const env = {
      ENVIRONMENT: 'production',
      NEWSLETTER_FREE_EMAILS: 'owner@example.com',
    };

    const claim = await resolveMembershipClaim(db, 'owner@example.com', env);
    assert.equal(claim, null);
    assert.equal(rows.size, 0);
  });

  it('does not reactivate a cancelled whitelist row as paid membership', async () => {
    const { db, rows } = createMembershipDb([
      {
        email: 'owner@example.com',
        membership_token: 'stale-token',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        amount_cents: null,
        active: 0,
        status: 'cancelled',
        membership_started_at: null,
        paused_at: null,
        cancelled_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      },
    ]);
    const env = {
      ENVIRONMENT: 'production',
      NEWSLETTER_FREE_EMAILS: 'owner@example.com',
    };

    const claim = await resolveMembershipClaim(db, 'owner@example.com', env);
    assert.equal(claim, null);
    assert.equal(rows.get('owner@example.com')?.active, 0);
  });

  it('still grants local-dev instant claim outside production', async () => {
    const { db } = createMembershipDb();
    const env = {
      ENVIRONMENT: 'development',
      MEMBERSHIP_DEV_EMAILS: 'dev@example.com',
    };

    const claim = await resolveMembershipClaim(db, 'dev@example.com', env);
    assert.equal(claim?.email, 'dev@example.com');
    assert.equal(claim?.membershipStatus, 'active');
    assert.ok(claim?.membershipToken);
  });
});
