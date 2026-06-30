import {
  buildSubscriberForClient,
  buildSubscriberStatusForClient,
  getSubscriberByToken,
  listSubscribers,
  subscribeEmail,
  unsubscribeByToken,
  verifySubscriberByToken,
} from '../store/email-subscribers.js';
import {
  isSubscriptionVerificationEmailConfigured,
  sendSubscriptionVerificationEmail,
} from './send-subscription-verification-email.js';

const subscribeRateLimit = new Map();
const SUBSCRIBE_RATE_MS = 30_000;

const VERIFY_PENDING_MESSAGE =
  'If that address is valid, we sent a confirmation link. Check your email to finish subscribing.';

function checkSubscribeRateLimit(key) {
  const now = Date.now();
  const last = subscribeRateLimit.get(key);
  if (last && now - last < SUBSCRIBE_RATE_MS) {
    return false;
  }
  subscribeRateLimit.set(key, now);
  return true;
}

function noStore(res) {
  res.set('Cache-Control', 'no-store');
}

function unsubscribeHtmlPage(success, message) {
  const title = success ? 'Unsubscribed' : 'Unsubscribe';
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
    <p>${message}</p>
  </div>
</body>
</html>`;
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
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export function registerEmailRoutes(app) {
  app.post('/v1/email/subscribe', async (req, res) => {
    noStore(res);
    try {
      const { email, categories, enabled } = req.body || {};
      const rateKey = `${req.ip || 'unknown'}:${String(email || '').toLowerCase()}`;
      if (!checkSubscribeRateLimit(rateKey)) {
        res.status(429).json({ error: 'Too many requests — try again shortly' });
        return;
      }

      const result = subscribeEmail({ email, categories, enabled });
      if (result.needsVerification) {
        if (!isSubscriptionVerificationEmailConfigured()) {
          res.status(503).json({
            error: 'Email verification is unavailable right now. Please try again later.',
          });
          return;
        }

        await sendSubscriptionVerificationEmail({
          email: result.record.email,
          verificationToken: result.verificationToken,
        });

        res.json({
          ok: true,
          pending: true,
          message: VERIFY_PENDING_MESSAGE,
        });
        return;
      }

      res.json({ ok: true, subscriber: buildSubscriberForClient(result.record) });
    } catch (err) {
      const message = err.message || 'Subscribe failed';
      const status = message.includes('unavailable') ? 503 : 400;
      res.status(status).json({ error: message });
    }
  });

  app.post('/v1/email/verify', (req, res) => {
    noStore(res);
    const token = String(req.body?.token || '').trim();
    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    const subscriber = verifySubscriberByToken(token);
    if (!subscriber) {
      res.status(410).json({ error: 'This confirmation link is invalid or has expired.' });
      return;
    }

    res.json({
      ok: true,
      verified: true,
      subscriber: buildSubscriberForClient(subscriber),
    });
  });

  app.get('/v1/email/verify', (req, res) => {
    noStore(res);
    const token = req.query?.token;
    if (!token) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(400).json({ error: 'token query parameter is required' });
        return;
      }
      res
        .status(400)
        .type('html')
        .send(verifyHtmlPage(false, 'Missing confirmation token.'));
      return;
    }

    const subscriber = verifySubscriberByToken(String(token));
    const wantsJson =
      req.headers.accept?.includes('application/json') ||
      req.query.format === 'json';

    if (wantsJson) {
      if (!subscriber) {
        res.status(410).json({ error: 'This confirmation link is invalid or has expired.' });
        return;
      }
      res.json({
        ok: true,
        verified: true,
        subscriber: buildSubscriberForClient(subscriber),
      });
      return;
    }

    res.type('html').send(
      verifyHtmlPage(
        Boolean(subscriber),
        subscriber
          ? 'Your email digest subscription is confirmed. You can close this tab.'
          : 'This confirmation link is invalid or has expired.',
      ),
    );
  });

  app.post('/v1/email/unsubscribe', (req, res) => {
    noStore(res);
    try {
      const token = String(req.body?.token || req.query?.token || '').trim();
      if (!token) {
        res.status(400).json({ error: 'token is required' });
        return;
      }
      const removed = unsubscribeByToken(token);
      res.json({ ok: true, removed });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Unsubscribe failed' });
    }
  });

  app.get('/v1/email/unsubscribe', (req, res) => {
    noStore(res);
    const token = req.query?.token;
    if (!token) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(400).json({ error: 'token query parameter is required' });
        return;
      }
      res.status(400).type('html').send(unsubscribeHtmlPage(false, 'Missing unsubscribe token.'));
      return;
    }

    const removed = unsubscribeByToken(String(token));
    const wantsJson =
      req.headers.accept?.includes('application/json') ||
      req.query.format === 'json';

    if (wantsJson) {
      res.json({ ok: true, removed });
      return;
    }

    res
      .type('html')
      .send(
        unsubscribeHtmlPage(
          removed,
          removed
            ? 'You have been unsubscribed from Unofficial Cursor News email digests.'
            : 'This unsubscribe link is invalid or has already been used.',
        ),
      );
  });

  app.get('/v1/email/status', (req, res) => {
    noStore(res);
    const token = String(req.query?.token || '').trim();
    if (!token) {
      res.status(400).json({ error: 'token query parameter is required' });
      return;
    }
    const subscriber = getSubscriberByToken(token);
    res.json(buildSubscriberStatusForClient(subscriber));
  });

  app.get('/v1/email/subscribers', (_req, res) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({
      subscribers: listSubscribers().map((s) => ({
        ...s,
        manageToken: undefined,
        verificationToken: undefined,
      })),
    });
  });
}
