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
import {
  isN8nNewsletterConfigured,
  shouldUseServerEmailDigest,
  triggerN8nNewsletter,
} from './trigger-n8n-newsletter.js';

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

  const n8nPromise = isN8nNewsletterConfigured(env)
    ? triggerN8nNewsletter({ newItems, ingestAt: cycleKey }, env)
    : Promise.resolve({ skipped: true, reason: 'n8n_not_configured' });

  const subscribers = await listSubscribers(db);

  if (!shouldUseServerEmailDigest(env)) {
    const n8nResult = await n8nPromise;
    return {
      sent: 0,
      failed: 0,
      items: newItems.length,
      subscribers: subscribers.length,
      n8n: n8nResult,
      delegatedToN8n: true,
    };
  }

  if (!isResendConfigured(env)) {
    const n8nResult = await n8nPromise;
    if (n8nResult.triggered) {
      return {
        skipped: true,
        reason: 'RESEND_API_KEY not configured',
        n8n: n8nResult,
      };
    }
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

  const n8nResult = await n8nPromise;

  console.log(
    JSON.stringify({
      event: 'email_digest_sent',
      sent,
      failed,
      skipped: false,
      items: newItems.length,
      subscribers: subscribers.length,
      digestSlot: cycleKey,
      n8nTriggered: Boolean(n8nResult?.triggered),
    }),
  );

  return {
    sent,
    failed,
    items: newItems.length,
    subscribers: subscribers.length,
    digestSlot: cycleKey,
    errors: errors.length ? errors : undefined,
    n8n: n8nResult,
  };
}
