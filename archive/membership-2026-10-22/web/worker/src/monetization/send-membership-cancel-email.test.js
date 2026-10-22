import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildMembershipCancelNotice } from './membership-cancel-notice.js';
import { buildMembershipCancelEmailContent } from './send-membership-cancel-email.js';

describe('buildMembershipCancelEmailContent', () => {
  it('includes invoice link and period-end subject', () => {
    const notice = buildMembershipCancelNotice({
      email: 'member@example.com',
      currentPeriodEnd: '2026-09-16T00:00:00.000Z',
      invoice: {
        id: 'in_1',
        number: 'ABC-0001',
        amountPaidCents: 100,
        currency: 'usd',
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/in_1',
      },
    });
    const email = buildMembershipCancelEmailContent(notice, {
      PUBLIC_WEB_BASE: 'https://cursorunofficial.news',
    });
    assert.match(email.subject, /cancellation is scheduled/);
    assert.match(email.html, /View invoice/);
    assert.match(email.html, /https:\/\/invoice\.stripe\.com\/i\/in_1/);
    assert.match(email.text, /ABC-0001/);
    assert.match(email.text, /member@example.com/);
  });

  it('falls back to the cancel page when there is no invoice URL', () => {
    const notice = buildMembershipCancelNotice({
      email: 'member@example.com',
      immediate: true,
    });
    const email = buildMembershipCancelEmailContent(notice, {
      PUBLIC_WEB_BASE: 'https://cursorunofficial.news',
    });
    assert.match(email.subject, /is cancelled/);
    assert.match(email.html, /membership\/unsubscribe/);
  });
});
