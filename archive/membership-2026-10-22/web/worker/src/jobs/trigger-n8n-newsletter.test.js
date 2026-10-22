import test from 'node:test';
import assert from 'node:assert/strict';

import { triggerN8nNewsletter } from './trigger-n8n-newsletter.js';

test('triggerN8nNewsletter skips when there are no new items', async () => {
  const result = await triggerN8nNewsletter({ newItems: [] }, {
    N8N_NEWSLETTER_WEBHOOK_URL: 'https://example.com/webhook',
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'no_new_items');
});

test('triggerN8nNewsletter skips when newItems is omitted', async () => {
  const result = await triggerN8nNewsletter({}, {
    N8N_NEWSLETTER_WEBHOOK_URL: 'https://example.com/webhook',
  });

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'no_new_items');
});
