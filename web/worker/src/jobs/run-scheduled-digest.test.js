import test from 'node:test';
import assert from 'node:assert/strict';

import { runScheduledDigest } from './run-scheduled-digest.js';

const ONE_PM_CT = new Date('2026-07-03T18:00:00.000Z');
const env = {
  DIGEST_TIMEZONE: 'America/Chicago',
  DIGEST_HOURS: '13',
  EMAIL_NOTIFICATIONS: 'true',
};

function createDigestDb({ queueItems = [], lastSlot = null, mutations = [] } = {}) {
  return {
    prepare(sql) {
      const query = String(sql);
      const statement = {
        bind(...params) {
          return {
            async run() {
              mutations.push({ query, params });
              return { success: true };
            },
          };
        },
        async all() {
          if (query.includes('FROM digest_queue')) {
            return { results: queueItems };
          }
          return { results: [] };
        },
        async first() {
          if (query.includes('last_digest_slot')) {
            return { last_digest_slot: lastSlot };
          }
          return null;
        },
        async run() {
          mutations.push({ query });
          return { success: true };
        },
      };
      return statement;
    },
  };
}

test('runScheduledDigest skips when digest queue is empty', async () => {
  const mutations = [];
  const db = createDigestDb({ queueItems: [], mutations });

  const result = await runScheduledDigest(db, env, { now: ONE_PM_CT });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'queue_empty');
  assert.equal(result.slot, '2026-07-03-13');
  assert.ok(mutations.some((entry) => entry.query.includes('last_digest_slot')));
});

test('runScheduledDigest skips when slot already sent', async () => {
  const db = createDigestDb({
    queueItems: [{ id: 'item-1', category: 'product', title: 'Test' }],
    lastSlot: '2026-07-03-13',
  });

  const result = await runScheduledDigest(db, env, { now: ONE_PM_CT });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'already_sent_this_slot');
});

test('runScheduledDigest skips outside digest hours', async () => {
  const noonCt = new Date('2026-07-03T17:00:00.000Z');
  const db = createDigestDb({
    queueItems: [{ id: 'item-1', category: 'product', title: 'Test' }],
  });

  const result = await runScheduledDigest(db, env, { now: noonCt });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'not_digest_hour');
});
