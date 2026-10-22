import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  alreadySubscribedError,
  buildMembershipCheckoutSessionParams,
  normalizeTierAmount,
} from './stripe-checkout.js';

describe('buildMembershipCheckoutSessionParams', () => {
  it('reuses an existing Stripe customer for any email', () => {
    const params = buildMembershipCheckoutSessionParams({
      webBase: 'https://cursorunofficial.news',
      priceId: 'price_1',
      tier: 5,
      email: 'member@example.com',
      customerId: 'cus_existing',
    });

    assert.equal(params.mode, 'subscription');
    assert.equal(params.customer, 'cus_existing');
    assert.equal(params.customer_email, undefined);
    assert.equal(params.metadata.membership_email, 'member@example.com');
    assert.equal(params.metadata.tier_amount, '5');
  });

  it('sends customer_email for first-time subscribers', () => {
    const params = buildMembershipCheckoutSessionParams({
      webBase: 'https://cursorunofficial.news',
      priceId: 'price_2',
      tier: 2,
      email: 'new@example.com',
      customerId: null,
    });

    assert.equal(params.customer_email, 'new@example.com');
    assert.equal(params.customer, undefined);
  });
});

describe('alreadySubscribedError', () => {
  it('uses a restore-access code instead of starting a second subscription', () => {
    const err = alreadySubscribedError('member@example.com');
    assert.equal(err.code, 'ALREADY_SUBSCRIBED');
    assert.match(err.message, /Restore access/);
  });
});

describe('normalizeTierAmount', () => {
  it('accepts $1–$5 and rejects other amounts', () => {
    assert.equal(normalizeTierAmount(3), 3);
    assert.throws(() => normalizeTierAmount(6), /amount must be one of/);
  });
});
