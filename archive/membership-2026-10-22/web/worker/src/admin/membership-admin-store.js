import { randomToken } from '../lib/crypto.js';
import { normalizeEmail } from '../store/email-subscribers.js';
import { listMembers } from '../store/memberships.js';
import {
  ACCESS_SOURCES,
  classifyMemberAccess,
  findIntruderCandidates,
} from './intruder-detection.js';

function rowToOverride(row) {
  if (!row) return null;
  return {
    email: row.email,
    overrideStatus: row.override_status,
    reason: row.reason || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToAudit(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email || null,
    action: row.action,
    actor: row.actor,
    detail: row.detail_json ? JSON.parse(row.detail_json) : null,
    createdAt: row.created_at,
  };
}

export async function appendAdminAudit(db, { email, action, actor = 'system', detail = null }) {
  const id = randomToken(16);
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO membership_admin_audit (id, email, action, actor, detail_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      email ? normalizeEmail(email) : null,
      action,
      actor,
      detail ? JSON.stringify(detail) : null,
      now,
    )
    .run();
  return { id, createdAt: now };
}

export async function listAccessOverrides(db) {
  const { results } = await db
    .prepare('SELECT * FROM membership_access_overrides ORDER BY updated_at DESC')
    .all();
  return results.map(rowToOverride);
}

export async function getAccessOverride(db, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return rowToOverride(
    await db
      .prepare('SELECT * FROM membership_access_overrides WHERE email = ?')
      .bind(normalized)
      .first(),
  );
}

export async function upsertAccessOverride(db, { email, overrideStatus, reason, actor = 'admin' }) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('Valid email required');
  if (!['allow', 'block'].includes(overrideStatus)) {
    throw new Error('overrideStatus must be allow or block');
  }

  const now = new Date().toISOString();
  const existing = await getAccessOverride(db, normalized);
  await db
    .prepare(
      `INSERT INTO membership_access_overrides (email, override_status, reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         override_status = excluded.override_status,
         reason = excluded.reason,
         updated_at = excluded.updated_at`,
    )
    .bind(normalized, overrideStatus, reason || null, existing?.createdAt || now, now)
    .run();

  await appendAdminAudit(db, {
    email: normalized,
    action: `override_${overrideStatus}`,
    actor,
    detail: { reason: reason || null },
  });

  if (overrideStatus === 'block') {
    await blockMemberAsIntruder(db, normalized, {
      actor,
      reason: reason || 'Manual admin block',
      skipAudit: true,
    });
  } else if (overrideStatus === 'allow') {
    await db
      .prepare(
        `UPDATE memberships SET blocked = 0, access_source = ?, updated_at = ? WHERE email = ?`,
      )
      .bind(ACCESS_SOURCES.MANUAL_ALLOW, now, normalized)
      .run();
  }

  return getAccessOverride(db, normalized);
}

export async function deleteAccessOverride(db, email, actor = 'admin') {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  await db
    .prepare('DELETE FROM membership_access_overrides WHERE email = ?')
    .bind(normalized)
    .run();
  await appendAdminAudit(db, {
    email: normalized,
    action: 'override_cleared',
    actor,
  });
  return true;
}

export async function blockMemberAsIntruder(
  db,
  email,
  { actor = 'system', reason = 'Auto-blocked intruder', skipAudit = false } = {},
) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const now = new Date().toISOString();

  await db
    .prepare(
      `UPDATE memberships SET
         active = 0,
         blocked = 1,
         status = 'blocked',
         access_source = ?,
         intruder_flagged_at = COALESCE(intruder_flagged_at, ?),
         updated_at = ?
       WHERE email = ?`,
    )
    .bind(ACCESS_SOURCES.UNKNOWN, now, now, normalized)
    .run();

  if (!skipAudit) {
    await appendAdminAudit(db, {
      email: normalized,
      action: 'intruder_blocked',
      actor,
      detail: { reason },
    });
  }

  return { email: normalized, blocked: true, blockedAt: now };
}

async function loadBmcActiveSet(db) {
  const active = new Set();
  try {
    const { results } = await db
      .prepare('SELECT email FROM bmc_members WHERE active = 1')
      .all();
    for (const row of results) {
      const email = normalizeEmail(row.email);
      if (email) active.add(email);
    }
  } catch {
    // bmc_members may not exist on fresh local DB
  }
  return active;
}

async function buildContextByEmail(db) {
  const overrides = await listAccessOverrides(db);
  const bmcActive = await loadBmcActiveSet(db);
  const map = new Map();
  for (const override of overrides) {
    map.set(normalizeEmail(override.email), { overrideStatus: override.overrideStatus });
  }
  for (const email of bmcActive) {
    const existing = map.get(email) || {};
    existing.bmcActive = true;
    map.set(email, existing);
  }
  return map;
}

export async function listMembersForAdmin(db, env) {
  const members = await listMembers(db);
  const contextByEmail = await buildContextByEmail(db);
  const bmcActive = await loadBmcActiveSet(db);

  return members.map((member) => {
    const email = normalizeEmail(member.email);
    const ctx = contextByEmail.get(email) || {};
    if (bmcActive.has(email)) ctx.bmcActive = true;
    const classification = classifyMemberAccess(member, env, ctx);
    return {
      ...member,
      accessSource: classification.accessSource,
      isIntruder: classification.isIntruder,
      isGrandfathered: classification.isGrandfathered,
      classificationReasons: classification.reasons,
      overrideStatus: ctx.overrideStatus || null,
    };
  });
}

export async function scanAndBlockIntruders(db, env, { actor = 'system', dryRun = false } = {}) {
  const members = await listMembers(db);
  const contextByEmail = await buildContextByEmail(db);
  const candidates = findIntruderCandidates(members, env, contextByEmail);

  const results = [];
  for (const { member, classification } of candidates) {
    if (dryRun) {
      results.push({
        email: member.email,
        action: 'would_block',
        reasons: classification.reasons,
      });
      continue;
    }
    await blockMemberAsIntruder(db, member.email, {
      actor,
      reason: classification.reasons.join('; '),
    });
    results.push({
      email: member.email,
      action: 'blocked',
      reasons: classification.reasons,
    });
  }

  if (!dryRun && results.length > 0) {
    await appendAdminAudit(db, {
      action: 'intruder_scan',
      actor,
      detail: { blockedCount: results.length, emails: results.map((r) => r.email) },
    });
  }

  return {
    scanned: members.length,
    intrudersFound: candidates.length,
    dryRun,
    results,
  };
}

export async function listAdminAudit(db, { limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const { results } = await db
    .prepare('SELECT * FROM membership_admin_audit ORDER BY created_at DESC LIMIT ?')
    .bind(safeLimit)
    .all();
  return results.map(rowToAudit);
}

export async function getAdminSummary(db, env) {
  const rows = await listMembersForAdmin(db, env);
  const active = rows.filter((m) => m.active).length;
  const blocked = rows.filter((m) => m.blocked).length;
  const intruders = rows.filter((m) => m.isIntruder && m.active).length;
  const grandfathered = rows.filter((m) => m.isGrandfathered).length;
  const stripeBacked = rows.filter((m) => m.accessSource === ACCESS_SOURCES.STRIPE).length;

  return {
    total: rows.length,
    active,
    blocked,
    pendingIntruders: intruders,
    grandfathered,
    stripeBacked,
  };
}
