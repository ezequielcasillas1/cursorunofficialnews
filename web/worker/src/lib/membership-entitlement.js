import {
  getPrimaryDevMemberEmail,
  isDevMemberEmail,
  isDevMembershipBypassEnabled,
  isNewsletterFreeEmail,
} from './membership-email-lists.js';
import { normalizeEmail } from '../store/email-subscribers.js';
import { activateMember, getEntitlement, getMember, getMemberByToken } from '../store/memberships.js';

async function ensureMemberRecord(db, email) {
  const existing = await getMember(db, email);
  if (existing) return existing;
  return activateMember(db, { email });
}

/**
 * Resolve newsletter entitlement for subscribe/resubscribe routes.
 * Supports normal membership tokens, local dev bypass, and prod free-email whitelist.
 */
export async function resolveNewsletterEntitlement(db, membershipToken, env) {
  const token = String(membershipToken || '').trim();
  if (token) {
    const entitlement = await getEntitlement(db, token, env);
    if (entitlement.newsletterUnlocked) return entitlement;
  }

  if (isDevMembershipBypassEnabled(env)) {
    const devEmail = getPrimaryDevMemberEmail(env);
    if (devEmail) {
      const member = await ensureMemberRecord(db, devEmail);
      return getEntitlement(db, member.membershipToken, env);
    }
  }

  return null;
}

/**
 * Claim-style helper for prod newsletter whitelist and local dev bypass.
 */
export async function resolveMembershipClaim(db, email, env) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  if (env?.ENVIRONMENT !== 'production' && isDevMemberEmail(normalized, env)) {
    const member = await activateMember(db, { email: normalized });
    return {
      email: member.email,
      membershipToken: member.membershipToken,
      adFree: true,
      newsletterUnlocked: true,
      membershipStatus: 'active',
    };
  }

  if (isNewsletterFreeEmail(normalized, env)) {
    const member = await activateMember(db, { email: normalized });
    return {
      email: member.email,
      membershipToken: member.membershipToken,
      adFree: true,
      newsletterUnlocked: true,
      membershipStatus: 'active',
    };
  }

  return null;
}

export async function getEntitlementByToken(db, token, env) {
  return getEntitlement(db, token, env);
}

export async function findMemberByToken(db, token) {
  return getMemberByToken(db, token);
}

export {
  getDevMemberEmails,
  getNewsletterFreeEmails,
  isDevMemberEmail,
  isDevMembershipBypassEnabled,
  isNewsletterFreeEmail,
} from './membership-email-lists.js';
