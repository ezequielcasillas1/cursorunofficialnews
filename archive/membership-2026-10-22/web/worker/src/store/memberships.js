import { randomToken } from '../lib/crypto.js';
import { getPublicWebBase } from '../lib/env.js';
import { isNewsletterFreeEmail } from '../lib/membership-email-lists.js';
import { normalizeEmail, isValidEmail } from './email-subscribers.js';

function generateMembershipToken() {
  return randomToken(32);
}

function rowToMember(row) {
  if (!row) return null;
  return {
    email: row.email,
    membershipToken: row.membership_token,
    stripeCustomerId: row.stripe_customer_id || null,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    amountCents: row.amount_cents ?? null,
    active: Boolean(row.active),
    status: row.status,
    membershipStartedAt: row.membership_started_at || null,
    pausedAt: row.paused_at || null,
    cancelledAt: row.cancelled_at || null,
    blocked: Boolean(row.blocked),
    accessSource: row.access_source || null,
    intruderFlaggedAt: row.intruder_flagged_at || null,
    updatedAt: row.updated_at,
  };
}

async function getMemberRow(db, email) {
  return db.prepare('SELECT * FROM memberships WHERE email = ?').bind(email).first();
}

async function getMemberRowByStripeCustomerId(db, stripeCustomerId) {
  if (!stripeCustomerId) return null;
  return db
    .prepare('SELECT * FROM memberships WHERE stripe_customer_id = ?')
    .bind(stripeCustomerId)
    .first();
}

async function upsertMember(db, record) {
  const coreBind = [
    record.email,
    record.membershipToken,
    record.stripeCustomerId || null,
    record.stripeSubscriptionId || null,
    record.amountCents ?? null,
    record.active ? 1 : 0,
    record.status,
    record.membershipStartedAt || null,
    record.pausedAt || null,
    record.cancelledAt || null,
    record.updatedAt,
  ];

  const coreSql = `INSERT INTO memberships
         (email, membership_token, stripe_customer_id, stripe_subscription_id, amount_cents, active, status, membership_started_at, paused_at, cancelled_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         membership_token = excluded.membership_token,
         stripe_customer_id = excluded.stripe_customer_id,
         stripe_subscription_id = excluded.stripe_subscription_id,
         amount_cents = excluded.amount_cents,
         active = excluded.active,
         status = excluded.status,
         membership_started_at = excluded.membership_started_at,
         paused_at = excluded.paused_at,
         cancelled_at = excluded.cancelled_at,
         updated_at = excluded.updated_at`;

  const adminSql = `INSERT INTO memberships
         (email, membership_token, stripe_customer_id, stripe_subscription_id, amount_cents, active, status, membership_started_at, paused_at, cancelled_at, blocked, access_source, intruder_flagged_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         membership_token = excluded.membership_token,
         stripe_customer_id = excluded.stripe_customer_id,
         stripe_subscription_id = excluded.stripe_subscription_id,
         amount_cents = excluded.amount_cents,
         active = excluded.active,
         status = excluded.status,
         membership_started_at = excluded.membership_started_at,
         paused_at = excluded.paused_at,
         cancelled_at = excluded.cancelled_at,
         blocked = excluded.blocked,
         access_source = excluded.access_source,
         intruder_flagged_at = excluded.intruder_flagged_at,
         updated_at = excluded.updated_at`;

  try {
    await db
      .prepare(adminSql)
      .bind(
        ...coreBind.slice(0, 10),
        record.blocked ? 1 : 0,
        record.accessSource || null,
        record.intruderFlaggedAt || null,
        record.updatedAt,
      )
      .run();
  } catch (err) {
    const message = String(err?.message || err);
    if (!/no such column|has no column named/i.test(message)) {
      throw err;
    }
    await db.prepare(coreSql).bind(...coreBind).run();
  }
  return record;
}

function buildActiveRecord(email, existing, { stripeCustomerId, stripeSubscriptionId, amountCents } = {}) {
  const hasStripe = Boolean(stripeSubscriptionId || stripeCustomerId);
  return {
    email,
    membershipToken: existing?.membershipToken || generateMembershipToken(),
    stripeCustomerId: stripeCustomerId || existing?.stripeCustomerId || null,
    stripeSubscriptionId: stripeSubscriptionId || existing?.stripeSubscriptionId || null,
    amountCents: amountCents ?? existing?.amountCents ?? null,
    active: true,
    status: 'active',
    membershipStartedAt: existing?.membershipStartedAt || new Date().toISOString(),
    pausedAt: null,
    cancelledAt: null,
    blocked: false,
    accessSource: hasStripe ? 'stripe' : existing?.accessSource || null,
    intruderFlaggedAt: null,
    updatedAt: new Date().toISOString(),
  };
}

/** Activate (or reactivate) a membership — called from checkout confirm + webhook. */
export async function activateMember(
  db,
  { email, stripeCustomerId, stripeSubscriptionId, amountCents } = {},
) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Invalid membership email');
  }

  const existing = rowToMember(await getMemberRow(db, normalized));
  const record = buildActiveRecord(normalized, existing, {
    stripeCustomerId,
    stripeSubscriptionId,
    amountCents,
  });
  await upsertMember(db, record);
  return record;
}

export async function pauseMember(db, { email, stripeCustomerId } = {}) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Invalid membership email');
  }

  const existing = rowToMember(await getMemberRow(db, normalized));
  const record = existing || {
    email: normalized,
    membershipToken: generateMembershipToken(),
    stripeCustomerId: stripeCustomerId || null,
    membershipStartedAt: null,
  };

  record.active = false;
  record.status = 'paused';
  record.stripeCustomerId = stripeCustomerId || record.stripeCustomerId || null;
  record.pausedAt = new Date().toISOString();
  record.cancelledAt = null;
  record.blocked = record.blocked ?? false;
  record.updatedAt = new Date().toISOString();
  await upsertMember(db, record);
  return true;
}

export async function deactivateMember(db, { email, stripeCustomerId } = {}) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Invalid membership email');
  }

  const existing = rowToMember(await getMemberRow(db, normalized));
  const record = existing || {
    email: normalized,
    membershipToken: generateMembershipToken(),
    stripeCustomerId: stripeCustomerId || null,
    membershipStartedAt: null,
  };

  record.active = false;
  record.status = 'cancelled';
  record.stripeCustomerId = stripeCustomerId || record.stripeCustomerId || null;
  record.cancelledAt = new Date().toISOString();
  record.pausedAt = null;
  record.blocked = record.blocked ?? false;
  record.updatedAt = new Date().toISOString();
  await upsertMember(db, record);
  return true;
}

export async function getMemberByToken(db, token) {
  if (!token) return null;
  return rowToMember(
    await db.prepare('SELECT * FROM memberships WHERE membership_token = ?').bind(token).first(),
  );
}

export async function getMemberByStripeCustomerId(db, stripeCustomerId) {
  return rowToMember(await getMemberRowByStripeCustomerId(db, stripeCustomerId));
}

export async function getMember(db, email) {
  return rowToMember(await getMemberRow(db, normalizeEmail(email)));
}

/** Used by the "restore membership on this device" magic-link flow. */
export async function claimMembershipAccess(db, email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('A valid email address is required');
  }

  const member = rowToMember(await getMemberRow(db, normalized));
  if (!member?.active) {
    return null;
  }

  return {
    email: member.email,
    membershipToken: member.membershipToken,
    active: true,
  };
}

/**
 * Single source-of-truth entitlement check. Both gated features (ad-free +
 * newsletter) mirror the same `active` flag today — kept as separate fields
 * so either can diverge later without changing the API contract.
 */
export async function getEntitlement(db, token, env = null) {
  const member = await getMemberByToken(db, token);
  if (!member) {
    return { active: false, adFree: false, newsletterUnlocked: false, email: null, membershipStatus: null };
  }

  const freeNewsletter = env ? isNewsletterFreeEmail(member.email, env) : false;

  if (member.blocked && !freeNewsletter) {
    return {
      active: false,
      adFree: false,
      newsletterUnlocked: false,
      email: member.email,
      membershipStatus: 'blocked',
    };
  }

  const active = Boolean(member.active);
  const membershipStatus = active
    ? 'active'
    : freeNewsletter
      ? 'newsletter_free'
      : member.status || 'cancelled';
  return {
    active,
    adFree: active,
    newsletterUnlocked: active || freeNewsletter,
    email: member.email,
    membershipStatus,
  };
}

export async function listMembers(db) {
  const { results } = await db.prepare('SELECT * FROM memberships').all();
  return results.map(rowToMember);
}

export function buildMembershipActivationUrl(token, env) {
  const base = getPublicWebBase(env).replace(/\/$/, '');
  return `${base}/?membership_token=${encodeURIComponent(token)}`;
}
