import { applyCategoryClassification } from '../classify/index.js';
import { filterItemsByFeedPolicy } from '../shared/feed/feedPolicy.js';
import { FEED_PAGE_SIZE } from '../shared/feed/feedPagination.js';
import { getSourceById, getSourceMeta } from '../sources/registry.js';
import { sanitizeExternalUrl } from '../shared/url/safe-external-url.js';

/** Stale-lock safety net — if a previous ingest crashed mid-run, allow a retry after this long. */
const INGEST_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function sanitizeNewsItem(item) {
  if (!item || typeof item !== 'object') return null;
  const source = item.sourceId ? getSourceById(item.sourceId) : null;
  // Sitemap-sourced items inherit <lastmod>, which is the sitemap's own
  // regeneration time — not the article date. Drop it so evergreen tutorials
  // cannot pose as today's news in the chronological All feed.
  const publishedAt =
    source?.ingestMethod === 'sitemap' ? null : item.publishedAt;
  const sanitized = {
    ...item,
    canonicalUrl: sanitizeExternalUrl(item.canonicalUrl),
    publishedAt,
  };
  return applyCategoryClassification(sanitized);
}

function sanitizeNewsItems(nextItems) {
  if (!Array.isArray(nextItems)) return [];
  return filterItemsByFeedPolicy(nextItems.map(sanitizeNewsItem).filter(Boolean));
}

function rowToItem(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    canonicalUrl: row.canonical_url,
    publishedAt: row.published_at,
    category: row.category,
    sourceId: row.source_id,
    sourceName: row.source_name,
    attributionLabel: row.attribution_label,
  };
}

function parseCategories({ category, categories } = {}) {
  if (categories?.length) return categories;
  if (!category) return [];
  return String(category)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

function sortByDateDesc(list) {
  return [...list].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

/** Round-robin across sources so one sitemap feed cannot fill the whole page. */
function diversifyBySource(list) {
  if (list.length <= 1) return sortByDateDesc(list);

  const bySource = new Map();
  for (const item of list) {
    const key = item.sourceId || 'unknown';
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key).push(item);
  }

  for (const bucket of bySource.values()) {
    bucket.sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });
  }

  const sourceIds = [...bySource.keys()].sort((a, b) => {
    const pa = getSourceMeta(a)?.priority ?? 999;
    const pb = getSourceMeta(b)?.priority ?? 999;
    return pa - pb;
  });

  const result = [];
  const cursor = Object.fromEntries(sourceIds.map((id) => [id, 0]));
  let progress = true;
  while (result.length < list.length && progress) {
    progress = false;
    for (const sourceId of sourceIds) {
      const bucket = bySource.get(sourceId);
      const i = cursor[sourceId];
      if (i < bucket.length) {
        result.push(bucket[i]);
        cursor[sourceId] = i + 1;
        progress = true;
      }
    }
  }
  return result;
}

function orderNewsList(list, { categoryList, officialOnly }) {
  if (officialOnly) {
    return sortByDateDesc(list);
  }
  // All sections: chronological timeline so tutorials sit at their real dates.
  if (categoryList.length === 0) {
    return sortByDateDesc(list);
  }
  return diversifyBySource(list);
}

export async function getNews(
  db,
  { category, categories, official, limit = FEED_PAGE_SIZE, offset = 0 } = {},
) {
  const categoryList = parseCategories({ category, categories });

  let query = 'SELECT * FROM news_items';
  const params = [];
  if (categoryList.length > 0) {
    query += ` WHERE category IN (${categoryList.map(() => '?').join(',')})`;
    params.push(...categoryList);
  }
  query += ' ORDER BY published_at DESC';

  const { results } = await db.prepare(query).bind(...params).all();
  let list = results.map(rowToItem);

  const officialOnly = official === true || official === 'true';
  if (officialOnly) {
    list = list.filter((item) => getSourceMeta(item.sourceId)?.isOfficial);
  }

  const ordered = orderNewsList(list, { categoryList, officialOnly });
  const total = ordered.length;
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const safeLimit = Math.max(1, Math.floor(limit) || FEED_PAGE_SIZE);
  const pageItems = ordered.slice(safeOffset, safeOffset + safeLimit);

  return { items: pageItems, total };
}

/** Full replace — mirrors the old replaceItems()/saveToDisk() semantics. */
export async function replaceItems(db, nextItems) {
  const sanitized = sanitizeNewsItems(nextItems);
  const now = new Date().toISOString();

  const insertStmt = db.prepare(
    `INSERT INTO news_items
       (id, title, excerpt, canonical_url, published_at, category, source_id, source_name, attribution_label, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const statements = [
    db.prepare('DELETE FROM news_items'),
    ...sanitized.map((item) =>
      insertStmt.bind(
        item.id,
        item.title,
        item.excerpt,
        item.canonicalUrl,
        item.publishedAt,
        item.category,
        item.sourceId,
        item.sourceName,
        item.attributionLabel,
        now,
      ),
    ),
  ];

  await db.batch(statements);
  return sanitized;
}

export async function setLastIngestAt(db, iso) {
  await db.prepare('UPDATE ingest_state SET last_ingest_at = ? WHERE id = 1').bind(iso).run();
}

export async function getLastIngestAt(db) {
  const row = await db.prepare('SELECT last_ingest_at FROM ingest_state WHERE id = 1').first();
  return row?.last_ingest_at || null;
}

export async function getStatus(db) {
  const countRow = await db.prepare('SELECT COUNT(*) AS count FROM news_items').first();
  const lastIngestAt = await getLastIngestAt(db);
  return {
    itemCount: Number(countRow?.count || 0),
    lastIngestAt,
  };
}

/**
 * Atomic compare-and-swap lock — replaces the in-process `ingestLock` Promise
 * mutex. D1 statements are single-writer, so this UPDATE is race-free: only
 * one caller will see `meta.changes > 0`.
 */
export async function acquireIngestLock(db) {
  const now = Date.now();
  const staleThreshold = new Date(now - INGEST_LOCK_TIMEOUT_MS).toISOString();
  const nowIso = new Date(now).toISOString();
  const result = await db
    .prepare(
      'UPDATE ingest_state SET running = 1, started_at = ? WHERE id = 1 AND (running = 0 OR started_at < ?)',
    )
    .bind(nowIso, staleThreshold)
    .run();
  return (result.meta?.changes || 0) > 0;
}

export async function releaseIngestLock(db) {
  await db.prepare('UPDATE ingest_state SET running = 0 WHERE id = 1').run();
}
