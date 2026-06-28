import crypto from 'crypto';
import {
  activateMember,
  deactivateMember,
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

function isActiveMembership(payload) {
  const status = String(
    payload?.status ||
      payload?.membership_status ||
      payload?.response?.status ||
      'active',
  ).toLowerCase();

  return !['cancelled', 'canceled', 'inactive', 'expired'].includes(status);
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

  const event = String(req.get('x-bmc-event') || req.get('X-Bmc-Event') || '').toLowerCase();
  const email = extractEmail(payload?.response || payload);

  if (!email) {
    res.json({ ok: true, ignored: true, reason: 'no email in payload' });
    return;
  }

  try {
    if (CANCEL_EVENTS.has(event)) {
      deactivateMember(email);
      res.json({ ok: true, event, email, active: false });
      return;
    }

    if (ACTIVE_EVENTS.has(event) || isActiveMembership(payload?.response || payload)) {
      activateMember(email);
      res.json({ ok: true, event, email, active: true });
      return;
    }

    res.json({ ok: true, ignored: true, event });
  } catch (err) {
    console.error('[bmc/webhook]', err.message || err);
    res.status(500).json({ error: err.message || 'Webhook handler failed' });
  }
}
