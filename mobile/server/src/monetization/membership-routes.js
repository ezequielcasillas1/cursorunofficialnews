import {
  activateMember,
  buildAdFreeActivationUrl,
  claimAdFreeAccess,
  getAdFreeStatus,
  getMember,
  isDevAdFreeEmail,
  listMembers,
} from '../store/bmc-members.js';
import { isValidEmail, normalizeEmail } from '../store/email-subscribers.js';
import {
  consumeMembershipClaimRequest,
  createMembershipClaimRequest,
} from '../store/membership-claim-requests.js';
import {
  isMembershipClaimEmailConfigured,
  sendMembershipClaimEmail,
} from './send-membership-claim-email.js';

const claimRateLimit = new Map();
const CLAIM_RATE_MS = 30_000;

function checkClaimRateLimit(key) {
  const now = Date.now();
  const last = claimRateLimit.get(key);
  if (last && now - last < CLAIM_RATE_MS) {
    return false;
  }
  claimRateLimit.set(key, now);
  return true;
}

const CLAIM_PENDING_MESSAGE =
  'If that email has an active membership, we sent a verification link.';

function noStore(res) {
  res.set('Cache-Control', 'no-store');
}

export function registerMembershipRoutes(app) {
  app.post('/v1/membership/claim', async (req, res) => {
    noStore(res);
    try {
      const email = normalizeEmail(req.body?.email);
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'A valid email address is required' });
        return;
      }

      const rateKey = `${req.ip || 'unknown'}:${email}`;
      if (!checkClaimRateLimit(rateKey)) {
        res.status(429).json({ error: 'Too many requests — try again shortly' });
        return;
      }

      if (process.env.NODE_ENV !== 'production' && isDevAdFreeEmail(email)) {
        const devRecord = activateMember(email);
        res.json({
          ok: true,
          adFree: true,
          email: devRecord.email,
          token: devRecord.adFreeToken,
          activationUrl: buildAdFreeActivationUrl(devRecord.adFreeToken),
        });
        return;
      }

      if (!isMembershipClaimEmailConfigured()) {
        res.status(503).json({
          error: 'Membership email verification is unavailable right now. Please try again later.',
        });
        return;
      }

      const member = getMember(email);
      if (member?.active) {
        const request = createMembershipClaimRequest(email);
        await sendMembershipClaimEmail({
          email,
          claimToken: request.token,
        });
      }

      res.json({
        ok: true,
        pending: true,
        message: CLAIM_PENDING_MESSAGE,
      });
    } catch (err) {
      const message = err.message || 'Claim failed';
      const status = message.includes('unavailable') ? 503 : 400;
      res.status(status).json({ error: message });
    }
  });

  app.post('/v1/membership/claim/verify', (req, res) => {
    noStore(res);
    const claimToken = String(req.body?.token || '').trim();
    if (!claimToken) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    const request = consumeMembershipClaimRequest(claimToken);
    if (!request) {
      res.status(410).json({ error: 'This verification link is invalid or has expired.' });
      return;
    }

    const claim = claimAdFreeAccess(request.email);
    if (!claim) {
      res.status(410).json({
        error: 'Your membership could not be verified. Please request a new verification link.',
      });
      return;
    }

    res.json({
      ok: true,
      adFree: true,
      email: claim.email,
      token: claim.adFreeToken,
      activationUrl: buildAdFreeActivationUrl(claim.adFreeToken),
    });
  });

  app.get('/v1/membership/status', (req, res) => {
    noStore(res);
    const token = String(req.query?.token || '').trim();
    if (!token) {
      res.status(400).json({ error: 'token query parameter is required' });
      return;
    }

    const status = getAdFreeStatus(token);
    res.json({
      ok: true,
      adFree: status.adFree,
      email: status.email,
      membershipStatus: status.membershipStatus,
    });
  });

  app.get('/v1/membership/members', (_req, res) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ members: listMembers() });
  });
}
