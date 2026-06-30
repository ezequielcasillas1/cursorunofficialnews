/**
 * Feed visibility policy — shared by ingest, API store, and clients.
 * Dated items before the cut are excluded; undated catalog items (sitemap/scrape) stay visible.
 */

export const FEED_PUBLISHED_AFTER_ISO = '2025-01-01T00:00:00.000Z';
export const FEED_PUBLISHED_AFTER_MS = Date.parse(FEED_PUBLISHED_AFTER_ISO);

export function parsePublishedMs(publishedAt) {
  if (!publishedAt) return null;
  const ms = Date.parse(publishedAt);
  return Number.isNaN(ms) ? null : ms;
}

/** Whether an item passes the 2025+ feed window for storage and API responses. */
export function isItemWithinFeedWindow(item) {
  if (!item || typeof item !== 'object') return false;
  const ms = parsePublishedMs(item.publishedAt);
  if (ms !== null) {
    return ms >= FEED_PUBLISHED_AFTER_MS;
  }
  // Undated sitemap/scrape catalog entries — no reliable pub date; keep as live source listings.
  return true;
}

export function filterItemsByFeedPolicy(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(isItemWithinFeedWindow);
}
