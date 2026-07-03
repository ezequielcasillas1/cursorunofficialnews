import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { activateMember, getEntitlement } from './memberships.js';

function createLegacyMembershipDb() {
  const rows = new Map();
  return {
    rows,
    db: {
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
                  if (query.includes('blocked')) {
                    const err = new Error('D1_ERROR: no such column: blocked');
                    err.cause = 'SQLITE_ERROR';
                    throw err;
                  }
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
    },
  };
}

describe('activateMember legacy D1 schema', () => {
  it('falls back to core upsert when admin columns are missing', async () => {
    const { db, rows } = createLegacyMembershipDb();
    const member = await activateMember(db, { email: 'ezequielcasillas1@gmail.com' });

    assert.equal(member.email, 'ezequielcasillas1@gmail.com');
    assert.equal(member.active, true);
    assert.ok(rows.has('ezequielcasillas1@gmail.com'));
  });
});

describe('getEntitlement newsletter whitelist', () => {
  it('unlocks newsletter for whitelisted email even when active=0', async () => {
    const { db } = createLegacyMembershipDb();
    const member = await activateMember(db, { email: 'ezequielcasillas1@gmail.com' });
    const env = {
      ENVIRONMENT: 'production',
      NEWSLETTER_FREE_EMAILS: 'ezequielcasillas1@gmail.com',
    };

    const entitlement = await getEntitlement(db, member.membershipToken, env);
    assert.equal(entitlement.newsletterUnlocked, true);
    assert.equal(entitlement.email, 'ezequielcasillas1@gmail.com');
  });
});
