import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMembershipCancelNotice,
  cancelNoticeIdempotencyKey,
  formatUsdFromCents,
  summarizePaidInvoice,
} from './membership-cancel-notice.js';

describe('summarizePaidInvoice', () => {
  it('maps hosted invoice URL and amount for the receipt', () => {
    assert.equal(summarizePaidInvoice(null), null);
    assert.deepEqual(
      summarizePaidInvoice({
        id: 'in_1',
        number: 'ABC-0001',
        amount_paid: 100,
        currency: 'usd',
        created: 1750000000,
        hosted_invoice_url: 'https://invoice.stripe.com/i/in_1',
        invoice_pdf: 'https://pay.stripe.com/invoice/in_1/pdf',
        status_transitions: { paid_at: 1750000000 },
      }),
      {
        id: 'in_1',
        number: 'ABC-0001',
        amountPaidCents: 100,
        currency: 'usd',
        paidAt: new Date(1750000000 * 1000).toISOString(),
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/in_1',
        invoicePdf: 'https://pay.stripe.com/invoice/in_1/pdf',
      },
    );
  });
});

describe('buildMembershipCancelNotice', () => {
  it('schedules period-end copy with invoice amount', () => {
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
    assert.equal(notice.headline, 'Cancellation scheduled');
    assert.match(notice.summary, /September 16, 2026/);
    assert.equal(notice.invoice.amountLabel, formatUsdFromCents(100, 'usd'));
    assert.equal(notice.email, 'member@example.com');
  });

  it('uses immediate copy when membership is ended now', () => {
    const notice = buildMembershipCancelNotice({
      email: 'member@example.com',
      immediate: true,
    });
    assert.equal(notice.headline, 'Membership cancelled');
    assert.match(notice.summary, /ended/);
    assert.equal(notice.invoice, null);
  });
});

describe('cancelNoticeIdempotencyKey', () => {
  it('keys on subscription and period end so retries do not double-send', () => {
    assert.equal(
      cancelNoticeIdempotencyKey({
        subscriptionId: 'sub_1',
        currentPeriodEnd: '2026-09-16T00:00:00.000Z',
      }),
      'membership-cancel-notice/sub_1/2026-09-16T00:00:00.000Z',
    );
  });
});
