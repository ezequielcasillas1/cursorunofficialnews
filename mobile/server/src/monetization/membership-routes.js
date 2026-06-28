import {
  activateMember,
  buildAdFreeActivationUrl,
  claimAdFreeAccess,
  getAdFreeStatus,
  isDevAdFreeEmail,
  listMembers,
} from '../store/bmc-members.js';
import { isValidEmail, normalizeEmail } from '../store/email-subscribers.js';

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

export function registerMembershipRoutes(app) {
  app.post('/v1/membership/claim', (req, res) => {
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

      if (isDevAdFreeEmail(email)) {
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

      const claim = claimAdFreeAccess(email);
      if (!claim) {
        res.status(404).json({
          error:
            'No active membership found for this email. Subscribe first, then try again in a minute.',
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
    } catch (err) {
      res.status(400).json({ error: err.message || 'Claim failed' });
    }
  });

  app.get('/v1/membership/status', (req, res) => {
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
