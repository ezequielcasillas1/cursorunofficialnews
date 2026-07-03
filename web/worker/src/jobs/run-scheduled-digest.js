import {
  DEFAULT_DIGEST_TIMEZONE,
  getCurrentDigestSlot,
  isScheduledDigestHour,
} from './digest-schedule.js';
import { notifyEmailSubscribers } from './send-email-digest.js';
import {
  clearDigestQueue,
  getDigestQueueCount,
  getLastDigestSlot,
  listQueuedDigestItems,
  setLastDigestSlot,
} from '../store/digest-queue.js';

/**
 * Send batched digest emails at configured local hours (default 13:00 / 1pm America/Chicago).
 * Called from the hourly cron — no-ops outside digest windows or if slot already sent.
 */
export async function runScheduledDigest(db, env, { force = false, now = new Date() } = {}) {
  if (env?.EMAIL_NOTIFICATIONS === 'false') {
    return { skipped: true, reason: 'EMAIL_NOTIFICATIONS=false' };
  }

  const slot = getCurrentDigestSlot(env, now);
  if (!force && !slot) {
    return { skipped: true, reason: 'not_digest_hour' };
  }

  const digestSlot = slot || `manual-${now.toISOString().slice(0, 16)}`;
  const lastSlot = await getLastDigestSlot(db);
  if (!force && lastSlot === digestSlot) {
    return { skipped: true, reason: 'already_sent_this_slot', slot: digestSlot };
  }

  const queuedItems = await listQueuedDigestItems(db);
  const queueCount = queuedItems.length;

  if (!queueCount) {
    if (slot) await setLastDigestSlot(db, digestSlot);
    return { skipped: true, reason: 'queue_empty', slot: digestSlot };
  }

  const result = await notifyEmailSubscribers(db, queuedItems, { digestSlot }, env);

  const shouldCommit =
    !result.skipped || Boolean(result.delegatedToN8n && result.n8n?.triggered);

  if (shouldCommit) {
    await clearDigestQueue(db);
    if (slot) await setLastDigestSlot(db, digestSlot);
  }

  console.log(
    JSON.stringify({
      event: 'scheduled_digest_sent',
      slot: digestSlot,
      queueCount,
      sent: result.sent,
      failed: result.failed,
      committed: shouldCommit,
      isDigestHour: isScheduledDigestHour(env, now),
    }),
  );

  return {
    ...result,
    slot: digestSlot,
    queueCount,
    scheduled: true,
    committed: shouldCommit,
  };
}

export async function getScheduledDigestStatus(db, env, now = new Date()) {
  const slot = getCurrentDigestSlot(env, now);
  return {
    slot,
    isDigestHour: Boolean(slot),
    lastSlot: await getLastDigestSlot(db),
    queueCount: await getDigestQueueCount(db),
    timezone: env?.DIGEST_TIMEZONE?.trim() || DEFAULT_DIGEST_TIMEZONE,
  };
}
