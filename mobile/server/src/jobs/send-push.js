import {
  assemblePushForItems,
} from '../../../shared/notifications/assemble-push.js';
import { listDevices, unregisterDevice } from '../store/device-tokens.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100;
const DEAD_TOKEN_ERRORS = new Set(['DeviceNotRegistered', 'InvalidCredentials']);

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function getItemsForDevice(device, newItems) {
  if (!device.enabled) return [];
  return newItems.filter((item) => device.categories.includes(item.category));
}

async function sendExpoPushChunk(messages) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Expo push failed (${res.status}): ${text}`);
  }

  return res.json();
}

function handleTicketErrors(messages, tickets) {
  let failed = 0;
  const errors = [];

  for (let i = 0; i < tickets.length; i += 1) {
    const ticket = tickets[i];
    const message = messages[i];
    if (ticket?.status === 'ok') continue;

    failed += 1;
    const detail = ticket?.details?.error || ticket?.message || 'unknown';
    errors.push({ token: message?.to, error: detail });

    if (DEAD_TOKEN_ERRORS.has(detail) && message?.to) {
      unregisterDevice(message.to);
      console.warn(`[push] Unregistered dead token (${detail})`);
    } else {
      console.error(`[push] Ticket error for ${message?.to}: ${detail}`);
    }
  }

  return { failed, errors };
}

/**
 * Notify subscribed devices about new items (digest: one push per device).
 * Skips when PUSH_NOTIFICATIONS=false or no devices registered.
 */
export async function notifySubscribers(newItems) {
  if (process.env.PUSH_NOTIFICATIONS === 'false') {
    return { skipped: true, reason: 'PUSH_NOTIFICATIONS=false' };
  }
  if (!newItems?.length) return { sent: 0, items: 0 };

  const messages = [];

  for (const device of listDevices()) {
    const items = getItemsForDevice(device, newItems);
    const payload = assemblePushForItems(items);
    if (!payload) continue;
    messages.push({
      to: device.token,
      channelId: 'cursor-news',
      ...payload,
    });
  }

  if (messages.length === 0) {
    console.log(
      JSON.stringify({
        event: 'push_sent',
        sent: 0,
        failed: 0,
        skipped: true,
        reason: 'no_subscribed_devices',
        items: newItems.length,
      }),
    );
    return { sent: 0, items: newItems.length, devices: 0 };
  }

  let sent = 0;
  let failed = 0;
  const allErrors = [];

  try {
    const chunks = chunkArray(messages, CHUNK_SIZE);
    for (const chunk of chunks) {
      const result = await sendExpoPushChunk(chunk);
      const tickets = result?.data || [];
      const chunkSent = tickets.filter((t) => t?.status === 'ok').length;
      sent += chunkSent;
      const { failed: chunkFailed, errors } = handleTicketErrors(chunk, tickets);
      failed += chunkFailed;
      allErrors.push(...errors);
    }

    console.log(
      JSON.stringify({
        event: 'push_sent',
        sent,
        failed,
        skipped: false,
        items: newItems.length,
        devices: messages.length,
      }),
    );

    return {
      sent,
      failed,
      items: newItems.length,
      errors: allErrors.length ? allErrors : undefined,
    };
  } catch (err) {
    console.error('[push]', err.message || err);
    console.log(
      JSON.stringify({
        event: 'push_sent',
        sent: 0,
        failed: messages.length,
        skipped: false,
        error: err.message,
        items: newItems.length,
      }),
    );
    return { sent: 0, failed: messages.length, error: err.message, items: newItems.length };
  }
}
