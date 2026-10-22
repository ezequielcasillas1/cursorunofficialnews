import assert from 'node:assert/strict';
import test from 'node:test';
import { canShowResubscribe, resolveResumeNotice } from './resolveResumeNotice.js';

test('maps Worker resume notice for the cancel screen', () => {
  const notice = resolveResumeNotice({
    ok: true,
    email: 'member@example.com',
    notice: {
      headline: 'Membership resumed',
      summary: 'Billing will continue. Next renewal is September 16, 2026.',
      nextRenewal: 'September 16, 2026',
      email: 'member@example.com',
    },
  });
  assert.equal(notice.headline, 'Membership resumed');
  assert.match(notice.summary, /September 16/);
});

test('hides resubscribe after resume or immediate cancel', () => {
  assert.equal(canShowResubscribe({ resumeNotice: { headline: 'Membership resumed' } }), false);
  assert.equal(canShowResubscribe({ cancelReceipt: { immediate: true } }), false);
  assert.equal(canShowResubscribe({ cancelReceipt: { canResubscribe: true } }), true);
  assert.equal(canShowResubscribe({ cancelEligibility: { alreadyScheduled: true } }), true);
});
