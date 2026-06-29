import crypto from 'crypto';
import {
  activateMember,
  deactivateMember,
  pauseMember,
} from '../store/bmc-members.js';

const ACTIVE_EVENTS = new Set([
  'membership.started',
  'membership.updated',
  'membership_started',
  'membership_updated',
]);

const CANCEL_EVENTS = new Set([
  'membership.cancelled',
  'membership_cancelled',
]);

const PAUSE_EVENTS = new Set([
  'membership.paused',
  'membership_paused',
  'membership.on_hold',
  'membership_on_hold',
  'membership.pause',
  'membership_pause',
]);

const RESUME_EVENTS = new Set([
  'membership.resumed',
  'membership_resumed',
  'membership.unpaused',
  'membership_unpaused',
]);

function verifySignature(rawBody, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function extractEmail(payload) {
  if (!payload || typeof payload !== 'object') return '';

  const candidates = [
    payload.supporter_email,
    payload.supporterEmail,
    payload.email,
    payload.payer_email,
    payload.payerEmail,
    payload.response?.supporter_email,
    payload.response?.email,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.includes('@')) {
      return value.trim().toLowerCase();
    }
  }

  return '';
}

function getMembershipData(payload) {
  return payload?.data || payload?.response || payload || {};
}

function extractEvent(req, payload) {
  const fromHeader = String(req.get('x-bmc-event') || req.get('X-Bmc-Event') || '').toLowerCase();
  if (fromHeader) return fromHeader;
  return String(payload?.type || payload?.event || '').toLowerCase();
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

function isCancelledMembership(data) {
  const cancelFields = [data.canceled, data.cancelled, data.is_canceled, data.isCancelled];
  for (const value of cancelFields) {
    if (value === true || value === 'true' || value === 1 || value === '1') return true;
    if (value === false || value === 'false' || value === 0 || value === '0') return false;
  }

  const status = String(data.status || data.membership_status || '').toLowerCase();
  return ['cancelled', 'canceled', 'inactive', 'expired'].includes(status);
}

function isActiveMembership(data) {
  if (isCancelledMembership(data)) return false;

  const status = String(data.status || data.membership_status || 'active').toLowerCase();

  return !['cancelled', 'canceled', 'inactive', 'expired', 'paused', 'on_hold', 'on hold', 'on-hold'].includes(
    status,
  );
}

export function handleBmcWebhook(req, res) {
  const secret = process.env.BMC_WEBHOOK_SECRET?.trim();
  if (!secret) {
    res.status(503).json({ error: 'BMC webhook not configured' });
    return;
  }

  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    res.status(400).json({ error: 'Empty webhook body' });
    return;
  }

  const signature = req.get('x-bmc-signature') || req.get('X-Bmc-Signature') || '';
  if (!verifySignature(rawBody, signature, secret)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON payload' });
    return;
  }

  const data = getMembershipData(payload);
  const event = extractEvent(req, payload);
  const email = extractEmail(data);
  const paused = PAUSE_EVENTS.has(event) || isPausedMembership(data);

  if (!email) {
    res.json({ ok: true, ignored: true, reason: 'no email in payload' });
    return;
  }

  try {
    if (paused) {
      pauseMember(email);
      res.json({ ok: true, event, email, active: false, membershipStatus: 'paused' });
      return;
    }

    if (CANCEL_EVENTS.has(event) || isCancelledMembership(data)) {
      deactivateMember(email);
      res.json({ ok: true, event, email, active: false, membershipStatus: 'cancelled' });
      return;
    }

    if (RESUME_EVENTS.has(event) || ACTIVE_EVENTS.has(event) || isActiveMembership(data)) {
      activateMember(email);
      res.json({ ok: true, event, email, active: true, membershipStatus: 'active' });
      return;
    }

    res.json({ ok: true, ignored: true, event });
  } catch (err) {
    console.error('[bmc/webhook]', err.message || err);
    res.status(500).json({ error: err.message || 'Webhook handler failed' });
  }
}
