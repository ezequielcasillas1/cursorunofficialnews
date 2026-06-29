import crypto from 'crypto';
import { normalizeEmail } from './email-subscribers.js';
import { loadJsonFile, saveJsonFile } from './json-persist.js';

const FILENAME = 'membership-claim-requests.json';
const requests = new Map();

function generateClaimToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function getMembershipClaimTtlMinutes() {
  const value = Number(process.env.MEMBERSHIP_CLAIM_TTL_MINUTES || 30);
  if (!Number.isFinite(value)) return 30;
  return Math.min(24 * 60, Math.max(5, Math.floor(value)));
}

function isExpired(record, now = Date.now()) {
  const expiresAt = Date.parse(record?.expiresAt || '');
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

function cleanupExpiredRequests(now = Date.now()) {
  let changed = false;
  for (const [token, record] of requests.entries()) {
    if (!record?.email || isExpired(record, now)) {
      requests.delete(token);
      changed = true;
    }
  }
  if (changed) {
    saveToDisk();
  }
}

function loadFromDisk() {
  const rows = loadJsonFile(FILENAME, []);
  requests.clear();
  for (const row of rows) {
    if (!row?.token || !row?.email) continue;
    requests.set(row.token, row);
  }
  cleanupExpiredRequests();
}

function saveToDisk() {
  saveJsonFile(FILENAME, [...requests.values()]);
}

loadFromDisk();

export function createMembershipClaimRequest(email) {
  const normalized = normalizeEmail(email);
  const now = Date.now();
  const expiresAt = new Date(now + getMembershipClaimTtlMinutes() * 60_000).toISOString();

  cleanupExpiredRequests(now);

  for (const [token, record] of requests.entries()) {
    if (record.email === normalized) {
      requests.delete(token);
    }
  }

  const token = generateClaimToken();
  const record = {
    token,
    email: normalized,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };

  requests.set(token, record);
  saveToDisk();
  return record;
}

export function consumeMembershipClaimRequest(token) {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) return null;

  const now = Date.now();
  cleanupExpiredRequests(now);

  const record = requests.get(normalizedToken);
  if (!record || isExpired(record, now)) {
    if (record) {
      requests.delete(normalizedToken);
      saveToDisk();
    }
    return null;
  }

  requests.delete(normalizedToken);
  saveToDisk();
  return record;
}
