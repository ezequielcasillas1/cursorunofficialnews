import { getStripeClient } from './stripe-client.js';
import { deactivateMember, getMemberByToken } from '../store/memberships.js';
import { unsubscribeByEmail } from '../store/email-subscribers.js';

export function isMembershipCancellable(member) {
  if (!member) {
    return { cancellable: false, reason: 'Membership not found' };
  }
  if (!member.active) {
    return {
      cancellable: false,
      reason: 'This membership is not active',
      membershipStatus: member.status || 'cancelled',
    };
  }
  return {
    cancellable: true,
    hasStripeSubscription: Boolean(member.stripeSubscriptionId),
    email: member.email,
  };
}

export async function getMembershipCancelEligibility(db, membershipToken, env = null) {
  const token = String(membershipToken || '').trim();
  if (!token) {
    return { cancellable: false, reason: 'token is required' };
  }

  const member = await getMemberByToken(db, token);
  const eligibility = isMembershipCancellable(member);
  const base = {
    ...eligibility,
    email: member?.email || null,
    hasStripeSubscription: Boolean(member?.stripeSubscriptionId),
    policy: member?.stripeSubscriptionId
      ? 'stripe_cancel_at_period_end'
      : 'immediate_deactivate',
    cancelAtPeriodEnd: false,
    alreadyScheduled: false,
    currentPeriodEnd: null,
    cancelAt: null,
  };

  if (!eligibility.cancellable || !member?.stripeSubscriptionId || !env) {
    return base;
  }

  try {
    const stripe = getStripeClient(env);
    const subscription = await stripe.subscriptions.retrieve(member.stripeSubscriptionId);
    return {
      ...base,
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      alreadyScheduled: Boolean(subscription.cancel_at_period_end),
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
    };
  } catch (err) {
    console.warn('[membership/cancel/eligibility] stripe retrieve:', err.message || err);
    return base;
  }
}

/** Cancel Stripe subscription at period end, or deactivate non-billable memberships immediately. */
export async function processMembershipCancel(env, db, { membershipToken } = {}) {
  const token = String(membershipToken || '').trim();
  if (!token) {
    throw new Error('membershipToken is required');
  }

  const member = await getMemberByToken(db, token);
  const eligibility = isMembershipCancellable(member);
  if (!eligibility.cancellable) {
    const err = new Error(eligibility.reason);
    err.code = 'NOT_CANCELLABLE';
    err.membershipStatus = eligibility.membershipStatus || member?.status || null;
    throw err;
  }

  if (!member.stripeSubscriptionId) {
    await deactivateMember(db, {
      email: member.email,
      stripeCustomerId: member.stripeCustomerId,
    });
    await unsubscribeByEmail(db, member.email);

    return {
      ok: true,
      email: member.email,
      membershipStatus: 'cancelled',
      immediate: true,
      newsletterEnded: true,
    };
  }

  const stripe = getStripeClient(env);
  const subscription = await stripe.subscriptions.retrieve(member.stripeSubscriptionId);

  if (subscription.status === 'canceled') {
    await deactivateMember(db, {
      email: member.email,
      stripeCustomerId: member.stripeCustomerId,
    });
    const err = new Error('This membership has already been cancelled');
    err.code = 'ALREADY_CANCELLED';
    throw err;
  }

  if (subscription.cancel_at_period_end) {
    return {
      ok: true,
      email: member.email,
      membershipStatus: 'active',
      cancelAtPeriodEnd: true,
      alreadyScheduled: true,
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000).toISOString()
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    };
  }

  const updated = await stripe.subscriptions.update(member.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return {
    ok: true,
    email: member.email,
    membershipStatus: 'active',
    cancelAtPeriodEnd: true,
    cancelAt: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
    currentPeriodEnd: updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null,
  };
}
