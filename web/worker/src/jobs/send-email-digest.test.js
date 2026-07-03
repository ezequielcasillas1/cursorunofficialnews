import test from 'node:test';
import assert from 'node:assert/strict';

import { notifyEmailSubscribers } from './send-email-digest.js';

function createSubscriberDb() {
  return {
    prepare() {
      return {
        bind() {
          return {
            async all() {
              return { results: [] };
            },
          };
        },
        async all() {
          return { results: [] };
        },
      };
    },
  };
}

test('notifyEmailSubscribers skips when there are no new items', async () => {
  const result = await notifyEmailSubscribers(createSubscriberDb(), [], {}, {
    EMAIL_NOTIFICATIONS: 'true',
    N8N_NEWSLETTER_WEBHOOK_URL: 'https://example.com/webhook',
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'no_new_items');
  assert.equal(result.sent, 0);
  assert.equal(result.items, 0);
});
