import {
  activateMember,
  buildMembershipActivationUrl,
  claimMembershipAccess,
  getMember,
  listMembers,
} from '../store/memberships.js';
import {
  getEntitlementByToken,
  isDevMemberEmail,
  resolveMembershipClaim,
} from '../lib/membership-entitlement.js';
import { isValidEmail, normalizeEmail } from '../store/email-subscribers.js';
import {
  consumeMembershipClaimRequest,
  createMembershipClaimRequest,
} from '../store/membership-claim-requests.js';
import {
  isMembershipClaimEmailConfigured,
  sendMembershipClaimEmail,
} from './send-membership-claim-email.js';
import { createMembershipCheckoutSession, retrieveCompletedCheckoutSession } from './stripe-checkout.js';
import {
  getMembershipRefundEligibility,
  MIN_REFUND_AMOUNT_CENTS,
  processMembershipRefund,
} from './stripe-refund.js';
import { checkRateLimit, clientRateKey } from '../security/rate-limit.js';
import { publicErrorMessage } from '../security/public-error.js';

// Module-level cache is fine — soft rate-limit hint only, resets on isolate recycle.
const claimRateLimit = new Map();
const CLAIM_RATE_MS = 30_000;
const CHECKOUT_RATE_MS = 30_000;
const REFUND_RATE_MS = 60_000;

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

export function registerMembershipRoutes(app) {
  app.post('/v1/membership/checkout', async (c) => {
    c.header('Cache-Control', 'no-store');
    if (!checkRateLimit(clientRateKey(c, 'membership-checkout'), CHECKOUT_RATE_MS)) {
      return c.json({ error: 'Too many requests — try again shortly' }, 429);
    }
    try {
      const body = await c.req.json().catch(() => ({}));
      const email = body?.email ? normalizeEmail(body.email) : '';
      if (email && !isValidEmail(email)) {
        return c.json({ error: 'Enter a valid email address' }, 400);
      }

      const { url } = await createMembershipCheckoutSession(c.env, { amount: body?.amount, email });
      return c.json({ ok: true, url });
    } catch (err) {
      return c.json({ error: publicErrorMessage(err, 'Could not start checkout', c.env) }, 400);
    }
  });

  // Client redirects here (or calls it directly) with the Checkout Session id from
  // the success_url — this is the synchronous path; the webhook is the durable one.
  app.get('/v1/membership/checkout/confirm', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const sessionId = String(c.req.query('session_id') || '').trim();
    if (!sessionId) {
      return c.json({ error: 'session_id query parameter is required' }, 400);
    }

    try {
      const session = await retrieveCompletedCheckoutSession(c.env, sessionId);
      if (session.status !== 'complete') {
        return c.json({ error: 'This checkout session has not completed yet.' }, 409);
      }

      const email = normalizeEmail(session.customer_details?.email || session.customer_email || '');
      if (!isValidEmail(email)) {
        return c.json({ error: 'Could not determine the membership email from Stripe.' }, 422);
      }

      const subscription = session.subscription;
      const customer = session.customer;
      const tierAmount = Number(session.metadata?.tier_amount);

      const member = await activateMember(db, {
        email,
        stripeCustomerId: typeof customer === 'string' ? customer : customer?.id,
        stripeSubscriptionId: typeof subscription === 'string' ? subscription : subscription?.id,
        amountCents: Number.isFinite(tierAmount) && tierAmount > 0
          ? Math.round(tierAmount * 100)
          : session.amount_total,
      });

      return c.json({
        ok: true,
        adFree: true,
        newsletterUnlocked: true,
        email: member.email,
        token: member.membershipToken,
        membershipStatus: 'active',
      });
    } catch (err) {
      console.error('[membership/checkout/confirm]', err.message || err);
      return c.json({ error: 'Could not confirm checkout session with Stripe.' }, 502);
    }
  });

  // "Restore membership on this device" — magic-link flow for users who lost their token.
  app.post('/v1/membership/claim', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    try {
      const body = await c.req.json().catch(() => ({}));
      const email = normalizeEmail(body?.email);
      if (!isValidEmail(email)) {
        return c.json({ error: 'A valid email address is required' }, 400);
      }

      const rateKey = `${c.req.header('cf-connecting-ip') || 'unknown'}:${email}`;
      if (!checkClaimRateLimit(rateKey)) {
        return c.json({ error: 'Too many requests — try again shortly' }, 429);
      }

      if (c.env.ENVIRONMENT !== 'production' && isDevMemberEmail(email, c.env)) {
        const devRecord = await activateMember(db, { email });
        return c.json({
          ok: true,
          adFree: true,
          newsletterUnlocked: true,
          email: devRecord.email,
          token: devRecord.membershipToken,
          activationUrl: buildMembershipActivationUrl(devRecord.membershipToken, c.env),
        });
      }

      const freeClaim = await resolveMembershipClaim(db, email, c.env);
      if (freeClaim?.newsletterUnlocked) {
        return c.json({
          ok: true,
          adFree: freeClaim.adFree,
          newsletterUnlocked: freeClaim.newsletterUnlocked,
          email: freeClaim.email,
          token: freeClaim.membershipToken,
          activationUrl: buildMembershipActivationUrl(freeClaim.membershipToken, c.env),
        });
      }

      if (!isMembershipClaimEmailConfigured(c.env)) {
        return c.json(
          { error: 'Membership email verification is unavailable right now. Please try again later.' },
          503,
        );
      }

      const member = await getMember(db, email);
      if (member?.active) {
        const request = await createMembershipClaimRequest(db, email, c.env);
        await sendMembershipClaimEmail({ email, claimToken: request.token }, c.env);
      }

      return c.json({ ok: true, pending: true, message: CLAIM_PENDING_MESSAGE });
    } catch (err) {
      const message = err.message || 'Claim failed';
      const status = message.includes('unavailable') ? 503 : 400;
      return c.json({ error: message }, status);
    }
  });

  app.post('/v1/membership/claim/verify', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const body = await c.req.json().catch(() => ({}));
    const claimToken = String(body?.token || '').trim();
    if (!claimToken) {
      return c.json({ error: 'token is required' }, 400);
    }

    const request = await consumeMembershipClaimRequest(db, claimToken);
    if (!request) {
      return c.json({ error: 'This verification link is invalid or has expired.' }, 410);
    }

    const claim = await claimMembershipAccess(db, request.email);
    if (!claim) {
      return c.json(
        { error: 'Your membership could not be verified. Please request a new verification link.' },
        410,
      );
    }

    return c.json({
      ok: true,
      adFree: true,
      newsletterUnlocked: true,
      email: claim.email,
      token: claim.membershipToken,
      activationUrl: buildMembershipActivationUrl(claim.membershipToken, c.env),
    });
  });

  app.get('/v1/membership/status', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const token = String(c.req.query('token') || '').trim();
    if (!token) {
      return c.json({ error: 'token query parameter is required' }, 400);
    }

    const status = await getEntitlementByToken(db, token, c.env);
    return c.json({
      ok: true,
      adFree: status.adFree,
      newsletterUnlocked: status.newsletterUnlocked,
      email: status.email,
      membershipStatus: status.membershipStatus,
    });
  });

  app.get('/v1/membership/refund/eligibility', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const token = String(c.req.query('token') || '').trim();
    if (!token) {
      return c.json({ error: 'token query parameter is required' }, 400);
    }

    const eligibility = await getMembershipRefundEligibility(db, token);
    return c.json({
      ok: true,
      minAmountCents: MIN_REFUND_AMOUNT_CENTS,
      ...eligibility,
    });
  });

  app.post('/v1/membership/refund', async (c) => {
    c.header('Cache-Control', 'no-store');
    if (!checkRateLimit(clientRateKey(c, 'membership-refund'), REFUND_RATE_MS)) {
      return c.json({ error: 'Too many requests — try again shortly' }, 429);
    }

    const db = c.env.DB;
    const body = await c.req.json().catch(() => ({}));
    const membershipToken = String(body?.membershipToken || body?.token || '').trim();
    if (!membershipToken) {
      return c.json({ error: 'membershipToken is required' }, 400);
    }

    try {
      const result = await processMembershipRefund(c.env, db, { membershipToken });
      return c.json(result);
    } catch (err) {
      const code = err.code || '';
      if (code === 'NOT_ELIGIBLE') {
        return c.json({ error: publicErrorMessage(err, 'Refund not available', c.env) }, 403);
      }
      if (code === 'ALREADY_REFUNDED') {
        return c.json({ error: publicErrorMessage(err, 'Already refunded', c.env) }, 409);
      }
      console.error('[membership/refund]', err.message || err);
      return c.json({ error: publicErrorMessage(err, 'Could not process refund', c.env) }, 502);
    }
  });

  app.get('/v1/membership/members', async (c) => {
    if (c.env.ENVIRONMENT === 'production') {
      return c.json({ error: 'Not found' }, 404);
    }
    const db = c.env.DB;
    return c.json({ members: await listMembers(db) });
  });
}
