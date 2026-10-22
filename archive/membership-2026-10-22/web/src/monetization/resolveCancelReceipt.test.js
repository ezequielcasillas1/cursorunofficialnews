import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCancelReceipt } from './resolveCancelReceipt.js';

test('renders the Worker notice as an on-screen receipt', () => {
  const receipt = resolveCancelReceipt({
    ok: true,
    email: 'member@example.com',
    notice: {
      headline: 'Cancellation scheduled',
      summary: 'You keep access until September 16, 2026.',
      emailed: true,
      email: 'member@example.com',
      accessUntil: 'September 16, 2026',
      invoice: {
        number: 'ABC-0001',
        amountLabel: '$1.00',
        hostedInvoiceUrl: 'https://invoice.stripe.com/i/in_1',
      },
    },
  });
  assert.equal(receipt.headline, 'Cancellation scheduled');
  assert.equal(receipt.emailed, true);
  assert.equal(receipt.invoice.number, 'ABC-0001');
  assert.equal(receipt.canResubscribe, true);
});

test('marks scheduled Stripe cancel as resubscribable', () => {
  const receipt = resolveCancelReceipt({
    ok: true,
    cancelAtPeriodEnd: true,
    notice: { headline: 'Cancellation scheduled', summary: 'Billing will not renew.' },
  });
  assert.equal(receipt.canResubscribe, true);
  assert.equal(receipt.immediate, false);
});

test('falls back to immediate copy when notice is missing', () => {
  const receipt = resolveCancelReceipt({
    ok: true,
    immediate: true,
    email: 'member@example.com',
  });
  assert.equal(receipt.headline, 'Membership cancelled');
  assert.match(receipt.summary, /ended/);
  assert.equal(receipt.emailed, false);
  assert.equal(receipt.canResubscribe, false);
});

test('returns null when there is nothing to show', () => {
  assert.equal(resolveCancelReceipt(null), null);
  assert.equal(resolveCancelReceipt({ ok: true }), null);
});
