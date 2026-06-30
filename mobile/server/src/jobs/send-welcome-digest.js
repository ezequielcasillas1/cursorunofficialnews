import { applyCategoryLimits } from '../../../shared/notifications/category-limits.js';
import { assembleEmailDigest } from '../notifications/assemble-email.js';
import { getNews } from '../store/memory-cache.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from '../notifications/resend-client.js';
import {
  getUnsubscribeUrl,
  isSubscriberVerified,
} from '../store/email-subscribers.js';

const WELCOME_RECENT_LIMIT = 10;
const WELCOME_LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000;

function getRecentItemsForSubscriber(subscriber) {
  const { items } = getNews({ limit: 50, offset: 0 });
  const cutoff = Date.now() - WELCOME_LOOKBACK_MS;

  const recent = items.filter((item) => {
    const publishedAt = item.publishedAt ? Date.parse(item.publishedAt) : 0;
    return !publishedAt || publishedAt >= cutoff;
  });

  return applyCategoryLimits(recent, subscriber).slice(0, WELCOME_RECENT_LIMIT);
}

/**
 * Send a one-time welcome digest after email verification so subscribers
 * receive their first newsletter without waiting for the next ingest cycle.
 */
export async function sendWelcomeDigest(subscriber) {
  if (process.env.EMAIL_NOTIFICATIONS === 'false') {
    return { skipped: true, reason: 'EMAIL_NOTIFICATIONS=false' };
  }
  if (!isResendConfigured()) {
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }
  if (!subscriber?.enabled || !isSubscriberVerified(subscriber)) {
    return { skipped: true, reason: 'subscriber_not_verified' };
  }

  const items = getRecentItemsForSubscriber(subscriber);
  if (items.length === 0) {
    return { skipped: true, reason: 'no_recent_items' };
  }

  const resend = getResendClient();
  const from = getTransactionalFromAddress();
  const unsubscribeUrl = getUnsubscribeUrl(subscriber);
  const { subject, html, text } = assembleEmailDigest(items, { unsubscribeUrl });
  const welcomeSubject = subject.startsWith('Unofficial Cursor News')
    ? `Welcome · ${subject}`
    : `Welcome · Unofficial Cursor News · ${items.length} recent headline${items.length === 1 ? '' : 's'}`;

  const headers = {};
  if (unsubscribeUrl) {
    headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  const { error } = await resend.emails.send(
    {
      from,
      to: [subscriber.email],
      subject: welcomeSubject,
      html,
      text,
      headers,
    },
    { idempotencyKey: `welcome-digest/${subscriber.email}` },
  );

  if (error) {
    throw new Error(error.message || 'Welcome digest send failed');
  }

  console.log(
    JSON.stringify({
      event: 'welcome_digest_sent',
      email: subscriber.email,
      items: items.length,
    }),
  );

  return { sent: true, items: items.length };
}
