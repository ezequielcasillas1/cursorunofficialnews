import crypto from 'crypto';
import { VALID_CATEGORY_IDS } from '../../../shared/notifications/constants.js';
import { loadJsonFile, saveJsonFile } from './json-persist.js';

const FILENAME = 'email-subscribers.json';
const VALID_CATEGORIES = new Set(VALID_CATEGORY_IDS);

/** @type {Map<string, object>} */
const subscribers = new Map();

const EMAIL_RE =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

function generateManageToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

function recordToken(record) {
  return record?.manageToken || record?.unsubscribeToken || '';
}

export function getVerificationTtlMinutes() {
  const value = Number(process.env.EMAIL_VERIFY_TTL_MINUTES || 1440);
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

function clearPendingVerification(record) {
  delete record.verificationToken;
  delete record.verificationExpiresAt;
}

function loadFromDisk() {
  const rows = loadJsonFile(FILENAME, []);
  subscribers.clear();
  let needsSave = false;
  for (const row of rows) {
    if (row?.email) {
      if (!row.manageToken) {
        row.manageToken = row.unsubscribeToken || generateManageToken();
        needsSave = true;
      }
      if (row.unsubscribeToken) {
        delete row.unsubscribeToken;
        needsSave = true;
      }
      if (row.verified === undefined) {
        row.verified = true;
        needsSave = true;
      }
      if (row.verified && row.verificationToken) {
        clearPendingVerification(row);
        needsSave = true;
      }
      if (!row.verified && isVerificationExpired(row)) {
        row.enabled = false;
        clearPendingVerification(row);
        needsSave = true;
      }
      subscribers.set(row.email, row);
    }
  }
  if (needsSave) saveToDisk();
}

function saveToDisk() {
  saveJsonFile(FILENAME, [...subscribers.values()]);
}

loadFromDisk();

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

export function subscribeEmail({ email, categories = [], enabled = true }) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('A valid email address is required');
  }

  const isEnabled = Boolean(enabled);
  const normalizedCategories = isEnabled ? normalizeCategories(categories) : [];
  if (isEnabled && normalizedCategories.length === 0) {
    throw new Error('Select at least one topic for email digest');
  }

  const existing = subscribers.get(normalized);
  const now = new Date().toISOString();

  if (!isEnabled) {
    const record = {
      email: normalized,
      categories: existing?.categories || normalizedCategories,
      enabled: false,
      verified: isSubscriberVerified(existing),
      manageToken: recordToken(existing) || generateManageToken(),
      subscribedAt: existing?.subscribedAt || now,
      verifiedAt: existing?.verifiedAt || null,
      updatedAt: now,
    };
    clearPendingVerification(record);
    subscribers.set(normalized, record);
    saveToDisk();
    return { needsVerification: false, record };
  }

  if (existing && isSubscriberVerified(existing)) {
    const record = {
      ...existing,
      email: normalized,
      categories: normalizedCategories,
      enabled: true,
      verified: true,
      manageToken: recordToken(existing) || generateManageToken(),
      subscribedAt: existing.subscribedAt || now,
      updatedAt: now,
    };
    clearPendingVerification(record);
    subscribers.set(normalized, record);
    saveToDisk();
    return { needsVerification: false, record };
  }

  const verificationToken = generateVerificationToken();
  const record = {
    email: normalized,
    categories: normalizedCategories,
    enabled: true,
    verified: false,
    verificationToken,
    verificationExpiresAt: new Date(
      Date.now() + getVerificationTtlMinutes() * 60_000,
    ).toISOString(),
    manageToken: recordToken(existing) || generateManageToken(),
    subscribedAt: existing?.subscribedAt || now,
    verifiedAt: null,
    updatedAt: now,
  };
  subscribers.set(normalized, record);
  saveToDisk();
  return { needsVerification: true, record, verificationToken };
}

export function verifySubscriberByToken(token) {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) return null;

  for (const record of subscribers.values()) {
    if (record.verificationToken !== normalizedToken) continue;
    if (isVerificationExpired(record)) {
      record.enabled = false;
      clearPendingVerification(record);
      record.updatedAt = new Date().toISOString();
      saveToDisk();
      return null;
    }

    record.verified = true;
    record.verifiedAt = new Date().toISOString();
    record.enabled = true;
    clearPendingVerification(record);
    record.updatedAt = record.verifiedAt;
    saveToDisk();
    return record;
  }

  return null;
}

export function unsubscribeEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('email is required');
  const removed = subscribers.delete(normalized);
  if (removed) saveToDisk();
  return removed;
}

export function unsubscribeByToken(token) {
  if (!token) return false;
  for (const [email, record] of subscribers.entries()) {
    if (recordToken(record) === token) {
      subscribers.delete(email);
      saveToDisk();
      return true;
    }
  }
  return false;
}

export function getSubscriberByToken(token) {
  if (!token) return null;
  for (const record of subscribers.values()) {
    if (recordToken(record) === token) return record;
  }
  return null;
}

export function getSubscriber(email) {
  const normalized = normalizeEmail(email);
  return subscribers.get(normalized) || null;
}

export function listSubscribers() {
  return [...subscribers.values()];
}

export function getSubscribedEmails(category) {
  return listSubscribers().filter(
    (s) =>
      s.enabled &&
      isSubscriberVerified(s) &&
      (!category || s.categories.includes(category)),
  );
}

export function getUnsubscribeUrl(subscriber) {
  const base = process.env.PUBLIC_API_BASE?.trim() || `http://127.0.0.1:${process.env.PORT || 8787}`;
  const token = recordToken(subscriber);
  if (!token) return null;
  return `${base.replace(/\/$/, '')}/v1/email/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function buildSubscriberForClient(subscriber) {
  if (!subscriber) return null;
  const verified = isSubscriberVerified(subscriber);
  return {
    email: subscriber.email,
    categories: Array.isArray(subscriber.categories) ? subscriber.categories : [],
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
      enabled: Boolean(subscriber.enabled),
      verified,
      pending,
      subscribedAt: subscriber.subscribedAt || null,
      verifiedAt: subscriber.verifiedAt || null,
      updatedAt: subscriber.updatedAt || null,
    },
  };
}
