import { ingestAllSources } from './feeds.js';
import { diffNewItems } from '../jobs/diff-new-items.js';
import { notifyEmailSubscribers } from '../jobs/send-email-digest.js';
import { notifySubscribers } from '../jobs/send-push.js';
import {
  acquireIngestLock,
  getLastIngestAt,
  getStatus,
  releaseIngestLock,
  replaceItems,
  setLastIngestAt,
} from '../store/news-store.js';

async function applyIngestResult(db, items, env) {
  if (items.length === 0) {
    console.warn('[ingest] No items returned — keeping existing cache');
    return { lastIngestAt: await getLastIngestAt(db), newCount: 0, count: 0 };
  }

  const newItems = await diffNewItems(db, items);
  await replaceItems(db, items);
  const ingestedAt = new Date().toISOString();
  await setLastIngestAt(db, ingestedAt);

  if (newItems.length > 0) {
    await Promise.all([
      notifySubscribers(db, newItems, env),
      notifyEmailSubscribers(db, newItems, { ingestAt: ingestedAt }, env),
    ]);
  }

  return { lastIngestAt: ingestedAt, newCount: newItems.length, count: items.length };
}

/**
 * Runs the full ingest pipeline under the D1 `ingest_state` lock. Returns
 * `{ skipped: true }` if another ingest is already running — replaces the
 * old in-process Promise mutex (`ingestLock` in the Express server).
 */
export async function runIngestWithLock(db, env) {
  const acquired = await acquireIngestLock(db);
  if (!acquired) {
    console.warn('[ingest] Skipped — another ingest is already running');
    return { skipped: true, reason: 'ingest_in_progress' };
  }

  try {
    const items = await ingestAllSources(env);
    return await applyIngestResult(db, items, env);
  } finally {
    await releaseIngestLock(db);
  }
}

/**
 * Best-effort "seed the cache" check. Cheap (COUNT query) once populated, so
 * it's safe to call from `ctx.waitUntil()` on every request until the first
 * ingest lands — there is no server "boot" event in Workers to hook instead.
 */
export async function bootstrapIngestIfEmpty(db, env) {
  const status = await getStatus(db);
  if (status.itemCount > 0) return;

  try {
    console.log('[bootstrap] Cache empty — running ingest…');
    const result = await runIngestWithLock(db, env);
    if (result.skipped) return;
    const count = (await getStatus(db)).itemCount;
    if (count > 0) {
      console.log(`[bootstrap] Ingested ${count} items (${result.newCount ?? 0} new)`);
    } else {
      console.warn('[bootstrap] Ingest returned 0 items — cache still empty');
    }
  } catch (err) {
    console.error('[bootstrap]', err.message || err);
  }
}
