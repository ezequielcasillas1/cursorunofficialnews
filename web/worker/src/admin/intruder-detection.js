import { normalizeEmail } from '../store/email-subscribers.js';
import {
  getDevMemberEmails,
  getNewsletterFreeEmails,
} from '../lib/membership-email-lists.js';

/**
 * INTRUDER HEURISTIC (local admin tooling — see admin/intruder-detection.js)
 *
 * Legitimate active members are NEVER flagged when any of:
 * 1. stripe_subscription_id present (Stripe checkout / webhook)
 * 2. stripe_customer_id + amount_cents (paid tier recorded)
 * 3. MEMBERSHIP_GRANDFATHER_EMAILS explicit allowlist
 * 4. membership_started_at on/before MEMBERSHIP_GRANDFATHER_BEFORE cutoff
 * 5. NEWSLETTER_FREE_EMAILS intentional prod whitelist
 * 6. Legacy bmc_members row with active=1 (early Buy Me a Coffee subscribers)
 * 7. membership_access_overrides.override_status = 'allow'
 *
 * Intruder candidates: active=1, no Stripe proof, not grandfathered, override != allow.
 * Auto-block sets blocked=1, active=0, status='blocked'.
 */

export const ACCESS_SOURCES = {
  STRIPE: 'stripe',
  GRANDFATHER_EMAIL: 'grandfather_email',
  GRANDFATHER_DATE: 'grandfather_date',
  NEWSLETTER_FREE: 'newsletter_free',
  BMC_LEGACY: 'bmc_legacy',
  DEV_BYPASS: 'dev_bypass',
  MANUAL_ALLOW: 'manual_allow',
  MANUAL_BLOCK: 'manual_block',
  UNKNOWN: 'unknown',
};

function parseEmailList(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

export function getGrandfatherEmails(env) {
  return parseEmailList(env?.MEMBERSHIP_GRANDFATHER_EMAILS);
}

export function getGrandfatherBeforeDate(env) {
  const raw = env?.MEMBERSHIP_GRANDFATHER_BEFORE?.trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function isOnOrBeforeCutoff(startedAt, cutoffIso) {
  if (!startedAt || !cutoffIso) return false;
  const started = Date.parse(startedAt);
  const cutoff = Date.parse(cutoffIso);
  if (!Number.isFinite(started) || !Number.isFinite(cutoff)) return false;
  return started <= cutoff;
}

function hasStripeProof(member) {
  if (member.stripeSubscriptionId) return true;
  if (member.stripeCustomerId && member.amountCents != null && member.amountCents > 0) {
    return true;
  }
  return false;
}

/**
 * Classify a member row for admin display and intruder detection.
 * @returns {{ accessSource: string, isIntruder: boolean, isGrandfathered: boolean, reasons: string[] }}
 */
export function classifyMemberAccess(member, env, { overrideStatus = null, bmcActive = false } = {}) {
  const email = normalizeEmail(member?.email);
  const reasons = [];

  if (overrideStatus === 'block') {
    return {
      accessSource: ACCESS_SOURCES.MANUAL_BLOCK,
      isIntruder: true,
      isGrandfathered: false,
      reasons: ['Manual admin block override'],
    };
  }

  if (overrideStatus === 'allow') {
    return {
      accessSource: ACCESS_SOURCES.MANUAL_ALLOW,
      isIntruder: false,
      isGrandfathered: true,
      reasons: ['Manual admin allow override'],
    };
  }

  if (hasStripeProof(member)) {
    reasons.push('Stripe customer or subscription on file');
    return {
      accessSource: ACCESS_SOURCES.STRIPE,
      isIntruder: false,
      isGrandfathered: false,
      reasons,
    };
  }

  const grandfatherEmails = getGrandfatherEmails(env);
  if (email && grandfatherEmails.includes(email)) {
    reasons.push('Listed in MEMBERSHIP_GRANDFATHER_EMAILS');
    return {
      accessSource: ACCESS_SOURCES.GRANDFATHER_EMAIL,
      isIntruder: false,
      isGrandfathered: true,
      reasons,
    };
  }

  const cutoff = getGrandfatherBeforeDate(env);
  if (cutoff && isOnOrBeforeCutoff(member.membershipStartedAt, cutoff)) {
    reasons.push(`membership_started_at on/before ${cutoff.slice(0, 10)}`);
    return {
      accessSource: ACCESS_SOURCES.GRANDFATHER_DATE,
      isIntruder: false,
      isGrandfathered: true,
      reasons,
    };
  }

  if (email && getNewsletterFreeEmails(env).includes(email)) {
    reasons.push('Listed in NEWSLETTER_FREE_EMAILS');
    return {
      accessSource: ACCESS_SOURCES.NEWSLETTER_FREE,
      isIntruder: false,
      isGrandfathered: true,
      reasons,
    };
  }

  if (bmcActive) {
    reasons.push('Legacy bmc_members active row');
    return {
      accessSource: ACCESS_SOURCES.BMC_LEGACY,
      isIntruder: false,
      isGrandfathered: true,
      reasons,
    };
  }

  if (env?.ENVIRONMENT !== 'production' && email && getDevMemberEmails(env).includes(email)) {
    reasons.push('Local MEMBERSHIP_DEV_EMAILS bypass');
    return {
      accessSource: ACCESS_SOURCES.DEV_BYPASS,
      isIntruder: false,
      isGrandfathered: true,
      reasons,
    };
  }

  if (member.active) {
    reasons.push('Active with no Stripe proof or allowlist match');
    return {
      accessSource: ACCESS_SOURCES.UNKNOWN,
      isIntruder: true,
      isGrandfathered: false,
      reasons,
    };
  }

  return {
    accessSource: member.accessSource || ACCESS_SOURCES.UNKNOWN,
    isIntruder: Boolean(member.blocked),
    isGrandfathered: false,
    reasons: member.blocked ? ['Previously blocked as intruder'] : ['Inactive membership'],
  };
}

/** Members that should be auto-blocked by the local admin scan. */
export function findIntruderCandidates(members, env, contextByEmail = new Map()) {
  const intruders = [];
  for (const member of members) {
    if (!member.active || member.blocked) continue;
    const ctx = contextByEmail.get(normalizeEmail(member.email)) || {};
    const classification = classifyMemberAccess(member, env, ctx);
    if (classification.isIntruder) {
      intruders.push({ member, classification });
    }
  }
  return intruders;
}
