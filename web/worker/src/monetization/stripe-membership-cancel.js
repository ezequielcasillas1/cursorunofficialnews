import { getStripeClient } from './stripe-client.js';
import { deactivateMember, getMemberByToken } from '../store/memberships.js';
import { unsubscribeByEmail } from '../store/email-subscribers.js';
import {
  shouldReconcileMembershipWithStripe,
  syncActiveMembershipFromStripe,
} from './stripe-membership-sync.js';
import {
  buildMembershipCancelNotice,
  cancelNoticeIdempotencyKey,
  fetchLatestPaidInvoiceSummary,
} from './membership-cancel-notice.js';
import { sendMembershipCancelEmail } from './send-membership-cancel-email.js';

async function withCancelNotice(env, member, result) {
  let invoice = null;
  if (member?.stripeSubscriptionId && env) {
    try {
      const stripe = getStripeClient(env);
      invoice = await fetchLatestPaidInvoiceSummary(stripe, member.stripeSubscriptionId);
    } catch (err) {
      console.warn('[membership/cancel] invoice lookup:', err.message || err);
    }
  }

  const notice = buildMembershipCancelNotice({
    email: member?.email || result.email,
    immediate: Boolean(result.immediate),
    alreadyScheduled: Boolean(result.alreadyScheduled),
    currentPeriodEnd: result.currentPeriodEnd || result.cancelAt || null,
    invoice,
  });

  let emailed = false;
  try {
    const sendResult = await sendMembershipCancelEmail(
      {
        notice,
        idempotencyKey: cancelNoticeIdempotencyKey({
          email: member?.email,
          subscriptionId: member?.stripeSubscriptionId,
          currentPeriodEnd: notice.currentPeriodEnd,
          immediate: notice.immediate,
        }),
      },
      env,
    );
    emailed = Boolean(sendResult?.sent);
  } catch (err) {
    console.warn('[membership/cancel] notice email:', err.message || err);
  }

  return {
    ...result,
    notice: { ...notice, emailed },
  };
}

async function memberForCancelToken(db, membershipToken, env) {
  const member = await getMemberByToken(db, membershipToken);
  if (!member || !shouldReconcileMembershipWithStripe(member) || !env) {
    return member;
  }
  try {
    const synced = await syncActiveMembershipFromStripe(db, member.email, env);
    if (synced?.active) return synced;
  } catch (err) {
    console.warn('[membership/cancel] stripe sync:', err.message || err);
  }
  return member;
}

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

  const member = await memberForCancelToken(db, token, env);
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
    resumable: false,
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
      resumable: Boolean(subscription.cancel_at_period_end),
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

  const member = await memberForCancelToken(db, token, env);
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

    return withCancelNotice(env, member, {
      ok: true,
      email: member.email,
      membershipStatus: 'cancelled',
      immediate: true,
      newsletterEnded: true,
    });
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
    return withCancelNotice(env, member, {
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
    });
  }

  const updated = await stripe.subscriptions.update(member.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  return withCancelNotice(env, member, {
    ok: true,
    email: member.email,
    membershipStatus: 'active',
    cancelAtPeriodEnd: true,
    cancelAt: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
    currentPeriodEnd: updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null,
  });
}
