import { assembleEmailDigest } from '../notifications/assemble-email.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from '../notifications/resend-client.js';
import {
  getUnsubscribeUrl,
  isSubscriberVerified,
  listSubscribers,
} from '../store/email-subscribers.js';

function getItemsForSubscriber(subscriber, newItems) {
  if (!subscriber.enabled) return [];
  if (!isSubscriberVerified(subscriber)) return [];
  if (!subscriber.categories?.length) return [];
  return newItems.filter((item) => subscriber.categories.includes(item.category));
}

/**
 * Send one digest email per subscriber when new items match their category prefs.
 * Skips when EMAIL_NOTIFICATIONS=false or RESEND_API_KEY is unset.
 */
export async function notifyEmailSubscribers(newItems, { ingestAt } = {}) {
  if (process.env.EMAIL_NOTIFICATIONS === 'false') {
    return { skipped: true, reason: 'EMAIL_NOTIFICATIONS=false' };
  }
  if (!isResendConfigured()) {
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }
  if (!newItems?.length) return { sent: 0, items: 0 };

  const resend = getResendClient();
  const from = getTransactionalFromAddress();
  const cycleKey = ingestAt || new Date().toISOString().slice(0, 13);
  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const subscriber of listSubscribers()) {
    const items = getItemsForSubscriber(subscriber, newItems);
    if (items.length === 0) continue;

    const unsubscribeUrl = getUnsubscribeUrl(subscriber);
    const { subject, html, text } = assembleEmailDigest(items, { unsubscribeUrl });
    const idempotencyKey = `digest/${cycleKey}/${subscriber.email}`;

    const headers = {};
    if (unsubscribeUrl) {
      headers['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    const { error } = await resend.emails.send(
      {
        from,
        to: [subscriber.email],
        subject,
        html,
        text,
        headers,
      },
      { idempotencyKey },
    );

    if (error) {
      failed += 1;
      console.error(`[email] Failed for ${subscriber.email}:`, error.message);
      errors.push({ email: subscriber.email, message: error.message });
      continue;
    }

    sent += 1;
  }

  console.log(
    JSON.stringify({
      event: 'email_digest_sent',
      sent,
      failed,
      skipped: false,
      items: newItems.length,
      subscribers: listSubscribers().length,
    }),
  );

  return {
    sent,
    failed,
    items: newItems.length,
    subscribers: listSubscribers().length,
    errors: errors.length ? errors : undefined,
  };
}
