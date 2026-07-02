import { randomToken } from '../lib/crypto.js';
import { normalizeEmail } from './email-subscribers.js';

function generateClaimToken() {
  return randomToken(32);
}

export function getMembershipClaimTtlMinutes(env) {
  const value = Number(env?.MEMBERSHIP_CLAIM_TTL_MINUTES || 30);
  if (!Number.isFinite(value)) return 30;
  return Math.min(24 * 60, Math.max(5, Math.floor(value)));
}

function isExpired(record, now = Date.now()) {
  const expiresAt = Date.parse(record?.expiresAt || '');
  return !Number.isFinite(expiresAt) || expiresAt <= now;
}

async function cleanupExpiredRequests(db, now = Date.now()) {
  const nowIso = new Date(now).toISOString();
  await db.prepare('DELETE FROM membership_claim_requests WHERE expires_at <= ?').bind(nowIso).run();
}

export async function createMembershipClaimRequest(db, email, env) {
  const normalized = normalizeEmail(email);
  const now = Date.now();
  const expiresAt = new Date(now + getMembershipClaimTtlMinutes(env) * 60_000).toISOString();

  await cleanupExpiredRequests(db, now);
  await db.prepare('DELETE FROM membership_claim_requests WHERE email = ?').bind(normalized).run();

  const token = generateClaimToken();
  const record = {
    token,
    email: normalized,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };

  await db
    .prepare(
      'INSERT INTO membership_claim_requests (token, email, created_at, expires_at) VALUES (?, ?, ?, ?)',
    )
    .bind(record.token, record.email, record.createdAt, record.expiresAt)
    .run();

  return record;
}

export async function consumeMembershipClaimRequest(db, token) {
  const normalizedToken = String(token || '').trim();
  if (!normalizedToken) return null;

  const now = Date.now();
  await cleanupExpiredRequests(db, now);

  const row = await db
    .prepare('SELECT * FROM membership_claim_requests WHERE token = ?')
    .bind(normalizedToken)
    .first();

  if (!row || isExpired({ expiresAt: row.expires_at }, now)) {
    if (row) {
      await db.prepare('DELETE FROM membership_claim_requests WHERE token = ?').bind(normalizedToken).run();
    }
    return null;
  }

  await db.prepare('DELETE FROM membership_claim_requests WHERE token = ?').bind(normalizedToken).run();
  return { token: row.token, email: row.email, createdAt: row.created_at, expiresAt: row.expires_at };
}
