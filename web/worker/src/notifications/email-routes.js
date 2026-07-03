import {
  buildSubscriberForClient,
  buildSubscriberStatusForClient,
  getSubscriber,
  getSubscriberByToken,
  hasValidPendingVerification,
  isSubscriberVerified,
  isValidEmail,
  listSubscribers,
  normalizeEmail,
  resubscribeByToken,
  subscribeEmail,
  unsubscribeByEmail,
  unsubscribeByToken,
  verifySubscriberByToken,
} from '../store/email-subscribers.js';
import { resolveNewsletterEntitlement } from '../lib/membership-entitlement.js';
import { buildUnsubscribeHtmlPage } from './unsubscribe/unsubscribe-html-page.js';
import { renderPageShell, renderMessageParagraph } from './unsubscribe/components/page-shell.js';
import { sendWelcomeDigest } from '../jobs/send-welcome-digest.js';
import { escapeHtml } from './unsubscribe/services/escape.js';
import { checkRateLimit, clientRateKey } from '../security/rate-limit.js';
import { publicErrorMessage } from '../security/public-error.js';
import { getPublicWebBase } from '../lib/env.js';
import {
  isSubscriptionVerificationEmailConfigured,
  sendSubscriptionVerificationEmail,
} from './send-subscription-verification-email.js';

const VERIFICATION_EMAIL_RATE_MS = 60_000;
const VERIFICATION_IP_RATE_MS = 60_000;
const EMAIL_ACTION_RATE_MS = 30_000;

const VERIFY_PENDING_MESSAGE =
  'If that address is valid, we sent a confirmation link. Check your email to finish subscribing.';

const VERIFY_RESEND_RATE_MESSAGE =
  'We recently sent a confirmation link to that address. Check your inbox and spam folder, or try again in a minute.';

const MEMBERSHIP_REQUIRED_MESSAGE =
  'An active membership is required to unlock the email newsletter.';

/**
 * Newsletter is membership-gated: the client sends `membershipToken`, we
 * re-derive the verified member email server-side (never trust a
 * client-submitted email) and require an active entitlement.
 */
async function requireNewsletterEntitlement(db, membershipToken, env) {
  return resolveNewsletterEntitlement(db, membershipToken, env);
}

// Module-level cache is fine here — it's just a soft rate-limit hint, not
// correctness-critical, and resets whenever the isolate recycles.
const verificationEmailRateLimit = new Map();

function queueWelcomeDigest(c, subscriber) {
  const { DB: db } = c.env;
  c.executionCtx.waitUntil(
    sendWelcomeDigest(db, subscriber, c.env).catch((error) => {
      console.error(`[email] Welcome digest failed for ${subscriber.email}:`, error.message);
    }),
  );
}

function checkVerificationEmailRateLimit(email) {
  const key = normalizeEmail(email);
  if (!key) return false;

  const now = Date.now();
  const last = verificationEmailRateLimit.get(key);
  if (last && now - last < VERIFICATION_EMAIL_RATE_MS) {
    return false;
  }
  verificationEmailRateLimit.set(key, now);
  return true;
}

function checkVerificationIpRateLimit(c) {
  return checkRateLimit(clientRateKey(c, 'email-verify-send'), VERIFICATION_IP_RATE_MS);
}

function markVerificationEmailSent(email) {
  verificationEmailRateLimit.set(normalizeEmail(email), Date.now());
}

function shouldSendVerificationEmail(result, resendVerification) {
  if (!result.needsVerification) return false;
  if (result.resendVerification) return true;
  return Boolean(resendVerification);
}

function wantsHtmlResponse(c) {
  const accept = c.req.header('accept') || '';
  return accept.includes('text/html');
}

function parseUnsubscribeToken(c, body = {}) {
  return String(body?.token || c.req.query('token') || '').trim();
}

function parseUnsubscribeEmail(body = {}) {
  return normalizeEmail(body?.email);
}

async function parseUnsubscribeBody(c) {
  const contentType = c.req.header('content-type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await c.req.parseBody().catch(() => ({}));
    return { token: form?.token, email: form?.email, _fromForm: true };
  }
  const json = await c.req.json().catch(() => ({}));
  return json;
}

function buildUnsubscribePageUrl(env, { token = '', email = '' } = {}) {
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (email) params.set('email', email);
  const query = params.toString();
  const base = `${getPublicWebBase(env).replace(/\/$/, '')}/newsletter/unsubscribe`;
  return query ? `${base}?${query}` : base;
}

function verifyHtmlPage(success, message) {
  const title = success ? 'Subscription confirmed' : 'Confirm subscription';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Unofficial Cursor News</title>
  <style>
    body { font-family: Georgia, serif; background: #f0ebe3; color: #0a0a0f; margin: 0; padding: 48px 16px; }
    .card { max-width: 480px; margin: 0 auto; background: #fffdf9; border: 1px solid #ddd6c8; border-radius: 8px; padding: 32px; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    p { line-height: 1.6; color: #5c5c6a; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

export function registerEmailRoutes(app) {
  app.post('/v1/email/subscribe', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    if (!checkRateLimit(clientRateKey(c, 'email-subscribe'), EMAIL_ACTION_RATE_MS)) {
      return c.json({ error: 'Too many requests — try again shortly' }, 429);
    }
    try {
      const body = await c.req.json().catch(() => ({}));
      const { categories, categoryLimits, officialOnly, enabled, resendVerification, membershipToken } = body || {};

      const entitlement = await requireNewsletterEntitlement(db, membershipToken, c.env);
      if (!entitlement) {
        return c.json({ error: MEMBERSHIP_REQUIRED_MESSAGE }, 402);
      }
      // Membership email is the verified source of truth — never trust a client-submitted email here.
      const normalizedEmail = entitlement.email;

      const isEnabled = enabled !== false;
      const existing = await getSubscriber(db, normalizedEmail);
      const wantsResend = Boolean(resendVerification);
      const needsVerificationFlow =
        isEnabled && (!existing || !isSubscriberVerified(existing));
      const willSendVerification =
        needsVerificationFlow &&
        (wantsResend || !hasValidPendingVerification(existing));

      if (willSendVerification && !isSubscriptionVerificationEmailConfigured(c.env)) {
        return c.json(
          { error: 'Email verification is unavailable right now. Please try again later.' },
          503,
        );
      }

      const result = await subscribeEmail(
        db,
        { email: normalizedEmail, categories, categoryLimits, officialOnly, enabled },
        c.env,
      );
      if (!result.needsVerification) {
        return c.json({ ok: true, subscriber: buildSubscriberForClient(result.record) });
      }

      if (!shouldSendVerificationEmail(result, wantsResend)) {
        return c.json({ ok: true, pending: true, message: VERIFY_PENDING_MESSAGE });
      }

      if (!checkVerificationIpRateLimit(c)) {
        return c.json({ error: VERIFY_RESEND_RATE_MESSAGE }, 429);
      }

      if (!checkVerificationEmailRateLimit(normalizedEmail)) {
        return c.json({ error: VERIFY_RESEND_RATE_MESSAGE }, 429);
      }

      try {
        await sendSubscriptionVerificationEmail(
          { email: result.record.email, verificationToken: result.verificationToken },
          c.env,
        );
      } catch (sendError) {
        verificationEmailRateLimit.delete(normalizedEmail);
        console.error(
          `[email] Verification email failed for ${result.record.email}:`,
          sendError.message,
        );
        return c.json(
          { error: sendError.message || 'Email verification is unavailable right now.' },
          503,
        );
      }

      markVerificationEmailSent(normalizedEmail);
      return c.json({ ok: true, pending: true, message: VERIFY_PENDING_MESSAGE });
    } catch (err) {
      const message = err.message || 'Subscribe failed';
      const status = message.includes('unavailable') ? 503 : 400;
      return c.json({ error: message }, status);
    }
  });

  app.post('/v1/email/verify', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const body = await c.req.json().catch(() => ({}));
    const token = String(body?.token || '').trim();
    if (!token) {
      return c.json({ error: 'token is required' }, 400);
    }

    const subscriber = await verifySubscriberByToken(db, token);
    if (!subscriber) {
      return c.json({ error: 'This confirmation link is invalid or has expired.' }, 410);
    }

    queueWelcomeDigest(c, subscriber);

    return c.json({
      ok: true,
      verified: true,
      subscriber: buildSubscriberForClient(subscriber),
    });
  });

  app.get('/v1/email/verify', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const token = c.req.query('token');
    const accept = c.req.header('accept') || '';
    const wantsJson = accept.includes('application/json') || c.req.query('format') === 'json';

    if (!token) {
      if (wantsJson) {
        return c.json({ error: 'token query parameter is required' }, 400);
      }
      return c.html(verifyHtmlPage(false, 'Missing confirmation token.'), 400);
    }

    const subscriber = await verifySubscriberByToken(db, String(token));

    if (wantsJson) {
      if (!subscriber) {
        return c.json({ error: 'This confirmation link is invalid or has expired.' }, 410);
      }
      queueWelcomeDigest(c, subscriber);
      return c.json({
        ok: true,
        verified: true,
        subscriber: buildSubscriberForClient(subscriber),
      });
    }

    if (subscriber) {
      queueWelcomeDigest(c, subscriber);
    }

    return c.html(
      verifyHtmlPage(
        Boolean(subscriber),
        subscriber
          ? 'Your email digest subscription is confirmed. You can close this tab.'
          : 'This confirmation link is invalid or has expired.',
      ),
    );
  });

  app.post('/v1/email/unsubscribe', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    try {
      const body = await parseUnsubscribeBody(c);
      const token = parseUnsubscribeToken(c, body);
      const email = parseUnsubscribeEmail(body);

      if (!token && !email) {
        if (wantsHtmlResponse(c) || body?._fromForm) {
          return c.html(
            renderPageShell({
              title: 'Unsubscribe',
              bodyContent: renderMessageParagraph('Missing unsubscribe token or email.'),
            }),
            400,
          );
        }
        return c.json({ error: 'token or email is required' }, 400);
      }

      if (token) {
        if (!checkRateLimit(clientRateKey(c, `email-unsub:${token.slice(0, 8)}`), EMAIL_ACTION_RATE_MS)) {
          const message = 'Too many requests — try again shortly';
          if (wantsHtmlResponse(c) || body?._fromForm) {
            return c.html(
              renderPageShell({ title: 'Unsubscribe', bodyContent: renderMessageParagraph(message) }),
              429,
            );
          }
          return c.json({ error: message }, 429);
        }

        const subscriber = await getSubscriberByToken(db, token);
        const removed = await unsubscribeByToken(db, token);

        if (wantsHtmlResponse(c) || body?._fromForm) {
          return c.html(
            buildUnsubscribeHtmlPage({
              success: removed,
              message: removed
                ? 'You have been unsubscribed from Unofficial Cursor News email digests.'
                : 'This unsubscribe link is invalid or has already been used.',
              token: removed ? token : '',
              previousCategories: subscriber?.categories || [],
              previousCategoryLimits: subscriber?.categoryLimits || {},
            }),
          );
        }

        return c.json({ ok: true, removed });
      }

      if (!checkRateLimit(clientRateKey(c, 'email-unsub-email'), EMAIL_ACTION_RATE_MS)) {
        const message = 'Too many requests — try again shortly';
        if (wantsHtmlResponse(c) || body?._fromForm) {
          return c.html(
            renderPageShell({ title: 'Unsubscribe', bodyContent: renderMessageParagraph(message) }),
            429,
          );
        }
        return c.json({ error: message }, 429);
      }

      if (!isValidEmail(email)) {
        if (wantsHtmlResponse(c) || body?._fromForm) {
          return c.html(
            renderPageShell({
              title: 'Unsubscribe',
              bodyContent: renderMessageParagraph('Enter a valid email address.'),
            }),
            400,
          );
        }
        return c.json({ error: 'Enter a valid email address.' }, 400);
      }

      await unsubscribeByEmail(db, email);

      if (wantsHtmlResponse(c) || body?._fromForm) {
        return c.html(
          buildUnsubscribeHtmlPage({
            success: true,
            message:
              'If that address was subscribed, you will no longer receive Unofficial Cursor News email digests.',
          }),
        );
      }

      return c.json({
        ok: true,
        removed: true,
        message:
          'If that address was subscribed, you will no longer receive Unofficial Cursor News email digests.',
      });
    } catch (err) {
      const message = publicErrorMessage(err, 'Unsubscribe failed', c.env);
      if (wantsHtmlResponse(c)) {
        return c.html(
          renderPageShell({ title: 'Unsubscribe', bodyContent: renderMessageParagraph(message) }),
          400,
        );
      }
      return c.json({ error: message }, 400);
    }
  });

  app.post('/v1/email/resubscribe', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    if (!checkRateLimit(clientRateKey(c, 'email-resubscribe'), EMAIL_ACTION_RATE_MS)) {
      return c.json({ error: 'Too many requests — try again shortly' }, 429);
    }
    try {
      const body = await c.req.json().catch(() => ({}));
      const token = String(body?.token || '').trim();
      if (!token) {
        return c.json({ error: 'token is required' }, 400);
      }

      const existing = await getSubscriberByToken(db, token);
      if (!existing) {
        return c.json({ error: 'This unsubscribe link is invalid or has already been used.' }, 410);
      }

      const { categories, categoryLimits, officialOnly, resendVerification, membershipToken } = body || {};

      const entitlement = await requireNewsletterEntitlement(db, membershipToken, c.env);
      if (!entitlement || entitlement.email !== existing.email) {
        return c.json({ error: MEMBERSHIP_REQUIRED_MESSAGE }, 402);
      }

      const wantsResend = Boolean(resendVerification);
      const needsVerificationFlow =
        !isSubscriberVerified(existing) ||
        (existing.enabled === false && !isSubscriberVerified(existing));
      const willSendVerification =
        needsVerificationFlow &&
        (wantsResend || !hasValidPendingVerification(existing));

      if (willSendVerification && !isSubscriptionVerificationEmailConfigured(c.env)) {
        return c.json(
          { error: 'Email verification is unavailable right now. Please try again later.' },
          503,
        );
      }

      const result = await resubscribeByToken(db, token, { categories, categoryLimits, officialOnly }, c.env);

      if (!result.needsVerification) {
        return c.json({ ok: true, subscriber: buildSubscriberForClient(result.record) });
      }

      if (!shouldSendVerificationEmail(result, wantsResend)) {
        return c.json({ ok: true, pending: true, message: VERIFY_PENDING_MESSAGE });
      }

      if (!checkVerificationIpRateLimit(c)) {
        return c.json({ error: VERIFY_RESEND_RATE_MESSAGE }, 429);
      }

      if (!checkVerificationEmailRateLimit(existing.email)) {
        return c.json({ error: VERIFY_RESEND_RATE_MESSAGE }, 429);
      }

      try {
        await sendSubscriptionVerificationEmail(
          { email: result.record.email, verificationToken: result.verificationToken },
          c.env,
        );
      } catch (sendError) {
        verificationEmailRateLimit.delete(normalizeEmail(existing.email));
        console.error(
          `[email] Resubscribe verification email failed for ${result.record.email}:`,
          sendError.message,
        );
        return c.json(
          { error: sendError.message || 'Email verification is unavailable right now.' },
          503,
        );
      }

      markVerificationEmailSent(existing.email);
      return c.json({ ok: true, pending: true, message: VERIFY_PENDING_MESSAGE });
    } catch (err) {
      const message = err.message || 'Resubscribe failed';
      const status = message.includes('unavailable') ? 503 : 400;
      return c.json({ error: message }, status);
    }
  });

  app.get('/v1/email/unsubscribe', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const token = String(c.req.query('token') || '').trim();
    const email = normalizeEmail(c.req.query('email'));
    const accept = c.req.header('accept') || '';
    const wantsJson = accept.includes('application/json') || c.req.query('format') === 'json';

    if (!wantsJson) {
      return c.redirect(buildUnsubscribePageUrl(c.env, { token, email }), 302);
    }

    if (!token) {
      return c.json({ error: 'token query parameter is required' }, 400);
    }

    const subscriber = await getSubscriberByToken(db, token);
    if (!subscriber) {
      return c.json({ error: 'This unsubscribe link is invalid or has already been used.' }, 410);
    }
    const removed = await unsubscribeByToken(db, token);
    return c.json({ ok: true, removed });
  });

  app.get('/v1/email/status', async (c) => {
    c.header('Cache-Control', 'no-store');
    const db = c.env.DB;
    const token = String(c.req.query('token') || '').trim();
    if (!token) {
      return c.json({ error: 'token query parameter is required' }, 400);
    }
    const subscriber = await getSubscriberByToken(db, token);
    return c.json(buildSubscriberStatusForClient(subscriber));
  });

  app.get('/v1/email/subscribers', async (c) => {
    if (c.env.ENVIRONMENT === 'production') {
      return c.json({ error: 'Not found' }, 404);
    }
    const db = c.env.DB;
    const subscribers = await listSubscribers(db);
    return c.json({
      subscribers: subscribers.map((s) => ({
        ...s,
        manageToken: undefined,
        verificationToken: undefined,
      })),
    });
  });
}
