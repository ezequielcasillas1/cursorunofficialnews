/**
 * Local BMC webhook shape check — no HMAC, exercises handler logic via store.
 * Usage: node scripts/simulate-bmc-shapes.mjs
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../data/bmc-members.json');

// Reset store file for deterministic run
const seed = {
  email: 'john@example.com',
  adFreeToken: crypto.randomBytes(32).toString('hex'),
  active: true,
  status: 'active',
  membershipStartedAt: new Date().toISOString(),
  pausedAt: null,
  cancelledAt: null,
  updatedAt: new Date().toISOString(),
};
fs.writeFileSync(dataPath, JSON.stringify([seed], null, 2));

const { activateMember, pauseMember, deactivateMember, getMember, getAdFreeStatus } = await import(
  '../src/store/bmc-members.js'
);

const PAUSE_EVENTS = new Set([
  'membership.paused',
  'membership_paused',
  'membership.on_hold',
  'membership_on_hold',
  'membership.pause',
  'membership_pause',
]);
const ACTIVE_EVENTS = new Set([
  'membership.started',
  'membership.updated',
  'membership_started',
  'membership_updated',
]);
const CANCEL_EVENTS = new Set(['membership.cancelled', 'membership_cancelled']);

function isCancelledMembership(data) {
  const cancelFields = [data.canceled, data.cancelled, data.is_canceled, data.isCancelled];
  for (const value of cancelFields) {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
  }
  const status = String(data.status || data.membership_status || '').toLowerCase();
  return ['cancelled', 'canceled', 'inactive', 'expired'].includes(status);
}

function getMembershipData(payload) {
  return payload?.data || payload?.response || payload || {};
}

function extractEmail(payload) {
  const candidates = [
    payload.supporter_email,
    payload.supporterEmail,
    payload.email,
    payload.payer_email,
    payload.payerEmail,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.includes('@')) {
      return value.trim().toLowerCase();
    }
  }
  return '';
}

function isPausedMembership(data) {
  const pausedFields = [data.paused, data.is_paused, data.isPaused, data.IsPaused];
  for (const value of pausedFields) {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
  }
  const status = String(data.status || data.membership_status || '').toLowerCase();
  return ['paused', 'on_hold', 'on hold', 'on-hold'].includes(status);
}

function isActiveMembership(data) {
  if (isCancelledMembership(data)) return false;
  const status = String(data.status || data.membership_status || 'active').toLowerCase();
  return !['cancelled', 'canceled', 'inactive', 'expired', 'paused', 'on_hold', 'on hold', 'on-hold'].includes(
    status,
  );
}

function applyWebhook(payload) {
  const event = String(payload?.type || payload?.event || '').toLowerCase();
  const data = getMembershipData(payload);
  const email = extractEmail(data);
  const paused = PAUSE_EVENTS.has(event) || isPausedMembership(data);

  if (!email) return { error: 'no email' };
  if (paused) {
    pauseMember(email);
    return { event, email, active: false, membershipStatus: 'paused' };
  }
  if (CANCEL_EVENTS.has(event) || isCancelledMembership(data)) {
    deactivateMember(email);
    return { event, email, active: false, membershipStatus: 'cancelled' };
  }
  if (isActiveMembership(data)) {
    activateMember(email);
    return { event, email, active: true, membershipStatus: 'active' };
  }
  return { ignored: true, event };
}

const shapes = [
  {
    name: 'started',
    payload: {
      type: 'membership.started',
      data: { supporter_email: 'john@example.com', status: 'active', paused: 'false' },
    },
    expect: { active: true, status: 'active', adFree: true },
  },
  {
    name: 'updated+paused',
    payload: {
      type: 'membership.updated',
      data: {
        supporter_email: 'john@example.com',
        status: 'paused',
        paused: 'true',
        paused_at: 1676552300,
      },
    },
    expect: { active: false, status: 'paused', adFree: false },
  },
  {
    name: 'cancelled',
    payload: {
      type: 'membership.cancelled',
      data: { supporter_email: 'john@example.com', status: 'cancelled', canceled: 'true' },
    },
    expect: { active: false, status: 'cancelled', adFree: false },
  },
  {
    name: 'paused',
    payload: {
      type: 'membership.paused',
      data: {
        supporter_email: 'john@example.com',
        status: 'paused',
        paused: 'true',
        paused_at: 1676552300,
        paused_until: 1679144300,
        paused_by: 'member',
        canceled: 'false',
      },
    },
    expect: { active: false, status: 'paused', adFree: false },
  },
];

let failed = 0;
for (const shape of shapes) {
  // Re-seed active before each shape except we chain: started -> updated+paused -> need reset
  activateMember('john@example.com');

  const result = applyWebhook(shape.payload);
  const member = getMember('john@example.com');
  const adFree = getAdFreeStatus(member.adFreeToken).adFree;

  const ok =
    result.membershipStatus === shape.expect.status &&
    member.active === shape.expect.active &&
    member.status === shape.expect.status &&
    adFree === shape.expect.adFree;

  console.log(
    ok ? 'PASS' : 'FAIL',
    shape.name,
    JSON.stringify({ result, member: { active: member.active, status: member.status }, adFree }),
  );
  if (!ok) failed += 1;
}

console.log(failed === 0 ? '\nAll shapes OK' : `\n${failed} shape(s) failed`);
process.exit(failed === 0 ? 0 : 1);
