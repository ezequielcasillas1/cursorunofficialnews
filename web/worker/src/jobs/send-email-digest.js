import { assembleEmailDigest } from '../notifications/assemble-email.js';
import { polishSingleHeadlineSections } from '../llm/rewrite-email-title.js';
import { getPublicWebBase } from '../lib/env.js';
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
import { buildSubscriberDigestSections } from '../shared/notifications/subscriber-digest.js';

function getItemsForSubscriber(subscriber, newItems) {
  if (!subscriber.enabled) return [];
  if (!isSubscriberVerified(subscriber)) return [];
  if (!subscriber.categories?.length) return [];
  return buildSubscriberDigestSections(newItems, subscriber);
}

/**
 * Send one digest email per subscriber for queued/batched new items.
 * Skips when EMAIL_NOTIFICATIONS=false or RESEND_API_KEY is unset.
 */
export async function notifyEmailSubscribers(db, newItems, { digestSlot, ingestAt } = {}, env) {
  if (env?.EMAIL_NOTIFICATIONS === 'false') {
    return { skipped: true, reason: 'EMAIL_NOTIFICATIONS=false' };
  }
  if (!newItems?.length) {
    return { skipped: true, reason: 'no_new_items', sent: 0, items: 0 };
  }

  const cycleKey = digestSlot || ingestAt || new Date().toISOString().slice(0, 13);

  const subscribers = await listSubscribers(db);

  if (!isResendConfigured(env)) {
    return { skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const resend = getResendClient(env);
  const from = getTransactionalFromAddress(env);
  let sent = 0;
  let failed = 0;
  const errors = [];

  for (const subscriber of subscribers) {
    let sections = getItemsForSubscriber(subscriber, newItems);
    if (sections.length === 0) continue;

    sections = await polishSingleHeadlineSections(sections, env);

    const unsubscribeUrl = getUnsubscribeUrl(subscriber, env);
    const { subject, html, text } = assembleEmailDigest(
      { sections },
      {
        unsubscribeUrl,
        subscriber,
        publicWebBase: getPublicWebBase(env),
      },
    );
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
      subscribers: subscribers.length,
      digestSlot: cycleKey,
    }),
  );

  return {
    sent,
    failed,
    items: newItems.length,
    subscribers: subscribers.length,
    digestSlot: cycleKey,
    errors: errors.length ? errors : undefined,
  };
}
