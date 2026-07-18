import { buildSubscriberDigestSections } from '../shared/notifications/subscriber-digest.js';
import { assembleEmailDigest } from '../notifications/assemble-email.js';
import { fetchRecentItemsForSubscriber } from '../notifications/newsletter-digest.js';
import { getPublicWebBase } from '../lib/env.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from '../notifications/resend-client.js';
import {
  getUnsubscribeUrl,
  isSubscriberVerified,
} from '../store/email-subscribers.js';

async function getRecentSectionsForSubscriber(db, subscriber) {
  const recent = await fetchRecentItemsForSubscriber(db, subscriber);
  return buildSubscriberDigestSections(recent, subscriber);
}

/**
 * Send a one-time welcome digest after email verification so subscribers
 * receive their first newsletter without waiting for the next ingest cycle.
 */
export async function sendWelcomeDigest(db, subscriber, env) {
  if (env?.EMAIL_NOTIFICATIONS === 'false') {
    return { skipped: true, reason: 'EMAIL_NOTIFICATIONS=false' };
  }
  if (!isResendConfigured(env)) {
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }
  if (!subscriber?.enabled || !isSubscriberVerified(subscriber)) {
    return { skipped: true, reason: 'subscriber_not_verified' };
  }

  const sections = await getRecentSectionsForSubscriber(db, subscriber);
  if (sections.length === 0) {
    return { skipped: true, reason: 'no_recent_items' };
  }

  const resend = getResendClient(env);
  const from = getTransactionalFromAddress(env);
  const unsubscribeUrl = getUnsubscribeUrl(subscriber, env);
  const itemCount = sections.reduce((sum, section) => sum + section.items.length, 0);
  const { subject, html, text } = assembleEmailDigest(
    { sections },
    {
      unsubscribeUrl,
      subscriber,
      publicWebBase: getPublicWebBase(env),
    },
  );
  const welcomeSubject = subject.startsWith('Unofficial Cursor News')
    ? `Welcome · ${subject}`
    : `Welcome · Unofficial Cursor News · ${itemCount} recent headline${itemCount === 1 ? '' : 's'}`;

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
      items: itemCount,
      sections: sections.length,
    }),
  );

  return { sent: true, items: itemCount, sections: sections.length };
}
