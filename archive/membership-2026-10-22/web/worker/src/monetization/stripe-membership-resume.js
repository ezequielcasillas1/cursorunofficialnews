import { getStripeClient } from './stripe-client.js';
import { getMemberByToken } from '../store/memberships.js';
import {
  shouldReconcileMembershipWithStripe,
  syncActiveMembershipFromStripe,
} from './stripe-membership-sync.js';
import { formatNoticeDate } from './membership-cancel-notice.js';

const RESUMABLE_STATUSES = new Set(['active', 'trialing', 'past_due']);

async function memberForResumeToken(db, membershipToken, env) {
  const member = await getMemberByToken(db, membershipToken);
  if (!member || !shouldReconcileMembershipWithStripe(member) || !env) {
    return member;
  }
  try {
    const synced = await syncActiveMembershipFromStripe(db, member.email, env);
    if (synced?.active) return synced;
  } catch (err) {
    console.warn('[membership/resume] stripe sync:', err.message || err);
  }
  return member;
}

export function currentPeriodEndIso(subscription) {
  const unix =
    subscription?.current_period_end ||
    subscription?.items?.data?.[0]?.current_period_end ||
    null;
  return unix ? new Date(unix * 1000).toISOString() : null;
}

/** Command gate: token member + Stripe sub that is still open. */
export function isMembershipResumable(member, subscription) {
  if (!member?.active) {
    return { resumable: false, reason: 'Membership not found or inactive', code: 'NOT_RESUMABLE' };
  }
  if (!member.stripeSubscriptionId) {
    return { resumable: false, reason: 'No Stripe subscription to resume', code: 'NOT_RESUMABLE' };
  }
  if (!subscription) {
    return { resumable: false, reason: 'Subscription not found', code: 'NOT_RESUMABLE' };
  }
  if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
    return {
      resumable: false,
      reason: 'This membership has already ended. Start a new membership to resubscribe.',
      code: 'ENDED',
    };
  }
  if (!RESUMABLE_STATUSES.has(subscription.status)) {
    return { resumable: false, reason: 'This subscription cannot be resumed', code: 'NOT_RESUMABLE' };
  }
  return {
    resumable: true,
    alreadyResumed: !subscription.cancel_at_period_end,
    email: member.email,
  };
}

export function buildMembershipResumeNotice({
  email,
  alreadyResumed = false,
  currentPeriodEnd = null,
} = {}) {
  const nextRenewal = formatNoticeDate(currentPeriodEnd);
  const headline = alreadyResumed ? 'Membership already renewing' : 'Membership resumed';
  const summary = alreadyResumed
    ? nextRenewal
      ? `Your membership is already set to renew. Next billing date is ${nextRenewal}.`
      : 'Your membership is already set to renew. Billing will continue.'
    : nextRenewal
      ? `Changed your mind — billing will continue. Next renewal is ${nextRenewal}.`
      : 'Changed your mind — billing will continue at the end of this period.';

  return {
    email: email || null,
    headline,
    summary,
    alreadyResumed: Boolean(alreadyResumed),
    currentPeriodEnd: currentPeriodEnd || null,
    nextRenewal,
  };
}

/** Undo a scheduled Stripe cancellation (`cancel_at_period_end: false`). Idempotent. */
export async function processMembershipResume(env, db, { membershipToken } = {}) {
  const token = String(membershipToken || '').trim();
  if (!token) {
    throw new Error('membershipToken is required');
  }

  const member = await memberForResumeToken(db, token, env);
  if (!member?.stripeSubscriptionId) {
    const err = new Error('No Stripe subscription to resume');
    err.code = 'NOT_RESUMABLE';
    throw err;
  }

  const stripe = getStripeClient(env);
  const subscription = await stripe.subscriptions.retrieve(member.stripeSubscriptionId);
  const eligibility = isMembershipResumable(member, subscription);
  if (!eligibility.resumable) {
    const err = new Error(eligibility.reason);
    err.code = eligibility.code || 'NOT_RESUMABLE';
    throw err;
  }

  const periodEnd = currentPeriodEndIso(subscription);
  if (eligibility.alreadyResumed) {
    return {
      ok: true,
      email: member.email,
      membershipStatus: 'active',
      cancelAtPeriodEnd: false,
      alreadyResumed: true,
      currentPeriodEnd: periodEnd,
      notice: buildMembershipResumeNotice({
        email: member.email,
        alreadyResumed: true,
        currentPeriodEnd: periodEnd,
      }),
    };
  }

  const updated = await stripe.subscriptions.update(member.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
  const nextPeriodEnd = currentPeriodEndIso(updated) || periodEnd;

  return {
    ok: true,
    email: member.email,
    membershipStatus: 'active',
    cancelAtPeriodEnd: false,
    alreadyResumed: false,
    currentPeriodEnd: nextPeriodEnd,
    notice: buildMembershipResumeNotice({
      email: member.email,
      alreadyResumed: false,
      currentPeriodEnd: nextPeriodEnd,
    }),
  };
}
