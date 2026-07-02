import { getKnownIds, updateKnownIds } from '../store/known-items.js';

/**
 * Compare incoming items with the last ingest snapshot.
 * Updates the snapshot and returns items that are newly seen.
 */
export async function diffNewItems(db, items) {
  const prev = await getKnownIds(db);
  const nextIds = items.map((item) => item.id);
  const newItems = prev.size === 0 ? [] : items.filter((item) => !prev.has(item.id));
  await updateKnownIds(db, nextIds);
  return newItems;
}
