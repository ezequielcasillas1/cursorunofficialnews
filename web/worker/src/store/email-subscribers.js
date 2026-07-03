import { normalizeCategoryLimits } from '../shared/notifications/category-limits.js';
import { VALID_CATEGORY_IDS } from '../shared/notifications/constants.js';
import { randomToken } from '../lib/crypto.js';
import { getPublicWebBase } from '../lib/env.js';

const VALID_CATEGORIES = new Set(VALID_CATEGORY_IDS);

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function generateManageToken() {
  return randomToken(32);
}

function generateVerificationToken() {
  return randomToken(32);
}

function recordToken(record) {
  return record?.manageToken || '';
}

export function getVerificationTtlMinutes(env) {
  const value = Number(env?.EMAIL_VERIFY_TTL_MINUTES || 1440);
  if (!Number.isFinite(value)) return 1440;
  return Math.min(7 * 24 * 60, Math.max(15, Math.floor(value)));
}

function isVerificationExpired(record, now = Date.now()) {
  const expiresAt = Date.parse(record?.verificationExpiresAt || '');
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

export function isSubscriberVerified(subscriber) {
  if (!subscriber) return false;
  if (subscriber.verified === undefined) return true;
  return Boolean(subscriber.verified);
}

export function hasValidPendingVerification(subscriber, now = Date.now()) {
  return Boolean(
    subscriber &&
      subscriber.enabled &&
      !isSubscriberVerified(subscriber) &&
      subscriber.verificationToken &&
      !isVerificationExpired(subscriber, now),
  );
}

function rowToSubscriber(row) {
  if (!row) return null;
  return {
    email: row.email,
    categories: JSON.parse(row.categories_json || '[]'),
    categoryLimits: JSON.parse(row.category_limits_json || '{}'),
    officialOnly: Boolean(row.official_only),
    enabled: Boolean(row.enabled),
    verified: Boolean(row.verified),
    verificationToken: row.verification_token || undefined,
    verificationExpiresAt: row.verification_expires_at || undefined,
    manageToken: row.manage_token,
    subscribedAt: row.subscribed_at,
    verifiedAt: row.verified_at || null,
    updatedAt: row.updated_at,
  };
}

async function getSubscriberRow(db, email) {
  return db.prepare('SELECT * FROM email_subscribers WHERE email = ?').bind(email).first();
}

async function upsertSubscriber(db, record) {
  await db
    .prepare(
      `INSERT INTO email_subscribers
         (email, categories_json, category_limits_json, official_only, enabled, verified, verification_token, verification_expires_at, manage_token, subscribed_at, verified_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         categories_json = excluded.categories_json,
         category_limits_json = excluded.category_limits_json,
         official_only = excluded.official_only,
         enabled = excluded.enabled,
         verified = excluded.verified,
         verification_token = excluded.verification_token,
         verification_expires_at = excluded.verification_expires_at,
         manage_token = excluded.manage_token,
         subscribed_at = excluded.subscribed_at,
         verified_at = excluded.verified_at,
         updated_at = excluded.updated_at`,
    )
    .bind(
      record.email,
      JSON.stringify(record.categories || []),
      JSON.stringify(record.categoryLimits || {}),
      record.officialOnly ? 1 : 0,
      record.enabled ? 1 : 0,
      record.verified ? 1 : 0,
      record.verificationToken || null,
      record.verificationExpiresAt || null,
      record.manageToken,
      record.subscribedAt,
      record.verifiedAt || null,
      record.updatedAt,
    )
    .run();
  return record;
}

export function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return [...new Set(categories.filter((c) => VALID_CATEGORIES.has(c)))];
}

export function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  return EMAIL_RE.test(normalized);
}

export async function subscribeEmail(
  db,
  { email, categories = [], categoryLimits, officialOnly, enabled = true },
  env,
) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('A valid email address is required');
  }

  const isEnabled = Boolean(enabled);
  const normalizedCategories = isEnabled ? normalizeCategories(categories) : [];
  if (isEnabled && normalizedCategories.length === 0) {
    throw new Error('Select at least one topic for email digest');
  }

  const existing = rowToSubscriber(await getSubscriberRow(db, normalized));
  const normalizedOfficialOnly =
    officialOnly === undefined ? Boolean(existing?.officialOnly) : Boolean(officialOnly);
  const normalizedLimits = isEnabled
    ? normalizeCategoryLimits(categoryLimits, normalizedCategories)
    : normalizeCategoryLimits(
        categoryLimits ?? existing?.categoryLimits,
        existing?.categories || normalizedCategories,
      );
  const now = new Date().toISOString();

  if (!isEnabled) {
    const record = {
      email: normalized,
      categories: existing?.categories || normalizedCategories,
      categoryLimits: normalizedLimits,
      officialOnly: normalizedOfficialOnly,
      enabled: false,
      verified: isSubscriberVerified(existing),
      manageToken: recordToken(existing) || generateManageToken(),
      subscribedAt: existing?.subscribedAt || now,
      verifiedAt: existing?.verifiedAt || null,
      updatedAt: now,
    };
    await upsertSubscriber(db, record);
    return { needsVerification: false, record, resendVerification: false };
  }

  if (existing && isSubscriberVerified(existing)) {
    const record = {
      ...existing,
      email: normalized,
      categories: normalizedCategories,
      categoryLimits: normalizedLimits,
      officialOnly: normalizedOfficialOnly,
      enabled: true,
      verified: true,
      manageToken: recordToken(existing) || generateManageToken(),
      subscribedAt: existing.subscribedAt || now,
      verificationToken: undefined,
      verificationExpiresAt: undefined,
      updatedAt: now,
    };
    await upsertSubscriber(db, record);
    return { needsVerification: false, record, resendVerification: false };
  }

  if (hasValidPendingVerification(existing)) {
    const record = {
      ...existing,
      email: normalized,
      categories: normalizedCategories,
      categoryLimits: normalizedLimits,
      officialOnly: normalizedOfficialOnly,
      enabled: true,
      verified: false,
      manageToken: recordToken(existing) || generateManageToken(),
      subscribedAt: existing.subscribedAt || now,
      verifiedAt: null,
      updatedAt: now,
    };
    await upsertSubscriber(db, record);
    return {
      needsVerification: true,
      record,
      verificationToken: record.verificationToken,
      resendVerification: false,
    };
  }

  const verificationToken = generateVerificationToken();
  const record = {
    email: normalized,
    categories: normalizedCategories,
    categoryLimits: normalizedLimits,
    officialOnly: normalizedOfficialOnly,
    enabled: true,
    verified: false,
    verificationToken,
    verificationExpiresAt: new Date(
      Date.now() + getVerificationTtlMinutes(env) * 60_000,
    ).toISOString(),
    manageToken: recordToken(existing) || generateManageToken(),
    subscribedAt: existing?.subscribedAt || now,
    verifiedAt: null,
    updatedAt: now,
  };
  await upsertSubscriber(db, record);
  return { needsVerification: true, record, verificationToken, resendVerification: true };
}

export async function verifySubscriberByToken(db, token) {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) return null;

  const row = await db
    .prepare('SELECT * FROM email_subscribers WHERE verification_token = ?')
    .bind(normalizedToken)
    .first();
  const record = rowToSubscriber(row);
  if (!record) return null;

  if (isVerificationExpired(record)) {
    record.enabled = false;
    record.verificationToken = undefined;
    record.verificationExpiresAt = undefined;
    record.updatedAt = new Date().toISOString();
    await upsertSubscriber(db, record);
    return null;
  }

  record.verified = true;
  record.verifiedAt = new Date().toISOString();
  record.enabled = true;
  record.verificationToken = undefined;
  record.verificationExpiresAt = undefined;
  record.updatedAt = record.verifiedAt;
  await upsertSubscriber(db, record);
  return record;
}

export async function unsubscribeEmail(db, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('email is required');
  const result = await db.prepare('DELETE FROM email_subscribers WHERE email = ?').bind(normalized).run();
  return (result.meta?.changes || 0) > 0;
}

/** Soft-disable digest emails for a subscriber matched by email (same as token unsubscribe). */
export async function unsubscribeByEmail(db, email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !isValidEmail(normalized)) return false;
  const record = await getSubscriber(db, normalized);
  if (!record) return false;
  if (!record.enabled) return true;
  record.enabled = false;
  record.updatedAt = new Date().toISOString();
  await upsertSubscriber(db, record);
  return true;
}

export async function unsubscribeByToken(db, token) {
  if (!token) return false;
  const record = rowToSubscriber(
    await db.prepare('SELECT * FROM email_subscribers WHERE manage_token = ?').bind(token).first(),
  );
  if (!record) return false;
  if (!record.enabled) return true;
  record.enabled = false;
  record.updatedAt = new Date().toISOString();
  await upsertSubscriber(db, record);
  return true;
}

export async function resubscribeByToken(db, token, { categories, categoryLimits, officialOnly } = {}, env) {
  const subscriber = await getSubscriberByToken(db, token);
  if (!subscriber) {
    throw new Error('This unsubscribe link is invalid or has already been used.');
  }
  return subscribeEmail(
    db,
    {
      email: subscriber.email,
      categories,
      categoryLimits,
      officialOnly: officialOnly ?? subscriber.officialOnly,
      enabled: true,
    },
    env,
  );
}

export async function getSubscriberByToken(db, token) {
  if (!token) return null;
  return rowToSubscriber(
    await db.prepare('SELECT * FROM email_subscribers WHERE manage_token = ?').bind(token).first(),
  );
}

export async function getSubscriber(db, email) {
  const normalized = normalizeEmail(email);
  return rowToSubscriber(await getSubscriberRow(db, normalized));
}

export async function listSubscribers(db) {
  const { results } = await db.prepare('SELECT * FROM email_subscribers').all();
  return results.map(rowToSubscriber);
}

export async function getSubscribedEmails(db, category) {
  const subscribers = await listSubscribers(db);
  return subscribers.filter(
    (s) =>
      s.enabled &&
      isSubscriberVerified(s) &&
      (!category || s.categories.includes(category)),
  );
}

export function getUnsubscribeUrl(subscriber, env) {
  const base = getPublicWebBase(env);
  const token = recordToken(subscriber);
  if (!token) return null;
  const params = new URLSearchParams({ token });
  if (subscriber?.email) {
    params.set('email', subscriber.email);
  }
  return `${base.replace(/\/$/, '')}/newsletter/unsubscribe?${params.toString()}`;
}

export function buildSubscriberForClient(subscriber) {
  if (!subscriber) return null;
  const verified = isSubscriberVerified(subscriber);
  return {
    email: subscriber.email,
    categories: Array.isArray(subscriber.categories) ? subscriber.categories : [],
    categoryLimits: normalizeCategoryLimits(
      subscriber.categoryLimits,
      subscriber.categories,
    ),
    officialOnly: Boolean(subscriber.officialOnly),
    enabled: Boolean(subscriber.enabled),
    verified,
    pending: Boolean(subscriber.enabled && !verified),
    subscribedAt: subscriber.subscribedAt || null,
    verifiedAt: subscriber.verifiedAt || null,
    updatedAt: subscriber.updatedAt || null,
    manageToken: verified ? recordToken(subscriber) || '' : '',
  };
}

export function buildSubscriberStatusForClient(subscriber) {
  if (!subscriber) {
    return {
      subscribed: false,
      pending: false,
      verified: false,
      subscriber: null,
    };
  }

  const verified = isSubscriberVerified(subscriber);
  const pending = Boolean(subscriber.enabled && !verified);

  return {
    subscribed: Boolean(subscriber.enabled && verified),
    pending,
    verified,
    subscriber: {
      email: subscriber.email,
      categories: Array.isArray(subscriber.categories) ? subscriber.categories : [],
      categoryLimits: normalizeCategoryLimits(
        subscriber.categoryLimits,
        subscriber.categories,
      ),
      officialOnly: Boolean(subscriber.officialOnly),
      enabled: Boolean(subscriber.enabled),
      verified,
      pending,
      subscribedAt: subscriber.subscribedAt || null,
      verifiedAt: subscriber.verifiedAt || null,
      updatedAt: subscriber.updatedAt || null,
    },
  };
}
