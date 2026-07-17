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

const MAX_NEWS_ID_LENGTH = 256;

function rowToItem(row) {
  const item = {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    commentary: row.commentary || '',
    canonicalUrl: row.canonical_url,
    publishedAt: row.published_at,
    category: row.category,
    sourceId: row.source_id,
    sourceName: row.source_name,
    attributionLabel: row.attribution_label,
  };
  return applyCategoryClassification(item);
}

function normalizeNewsId(id) {
  const safeId = String(id || '').trim();
  if (!safeId || safeId.length > MAX_NEWS_ID_LENGTH) return null;
  return safeId;
}

function parseCategories({ category, categories } = {}) {
  if (categories?.length) return categories;
  if (!category) return [];
  return String(category)
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

function parseSourceIds({ sources, sourceIds } = {}) {
  const raw = sources ?? sourceIds;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  return String(raw)
    .split(',')
    .map((id) => id.trim())
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
  { category, categories, official, sources, sourceIds, limit = FEED_PAGE_SIZE, offset = 0 } = {},
) {
  const categoryList = parseCategories({ category, categories });
  const sourceIdList = parseSourceIds({ sources, sourceIds });

  const { results } = await db.prepare('SELECT * FROM news_items ORDER BY published_at DESC').all();
  let list = results.map(rowToItem);

  if (categoryList.length > 0) {
    list = list.filter((item) => categoryList.includes(item.category));
  }

  const officialOnly = official === true || official === 'true';
  if (officialOnly) {
    list = list.filter((item) => getSourceMeta(item.sourceId)?.isOfficial);
  }

  if (sourceIdList.length > 0) {
    const allowed = new Set(sourceIdList);
    list = list.filter((item) => allowed.has(item.sourceId));
  }

  const ordered = orderNewsList(list, { categoryList, officialOnly });
  const total = ordered.length;
  const safeOffset = Math.max(0, Math.floor(offset) || 0);
  const safeLimit = Math.max(1, Math.floor(limit) || FEED_PAGE_SIZE);
  const pageItems = ordered.slice(safeOffset, safeOffset + safeLimit);

  return { items: pageItems, total };
}

/** Single item for article pages — validated id, null if missing. */
export async function getNewsItem(db, id) {
  const safeId = normalizeNewsId(id);
  if (!safeId) return null;
  const row = await db.prepare('SELECT * FROM news_items WHERE id = ?').bind(safeId).first();
  return row ? rowToItem(row) : null;
}

/** Recent ids for dynamic sitemap generation. */
export async function listRecentNewsIds(db, limit = 500) {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 500), 1000);
  const { results } = await db
    .prepare(
      'SELECT id, published_at FROM news_items ORDER BY published_at DESC LIMIT ?',
    )
    .bind(safeLimit)
    .all();
  return results || [];
}

/** Map of id → commentary for preserving notes across full replace. */
export async function getCommentaryMap(db) {
  try {
    const { results } = await db
      .prepare(
        `SELECT id, commentary FROM news_items
         WHERE commentary IS NOT NULL AND TRIM(commentary) != ''`,
      )
      .all();
    return new Map((results || []).map((row) => [row.id, row.commentary || '']));
  } catch (err) {
    console.warn('[news-store] commentary map unavailable:', err?.message || err);
    return new Map();
  }
}

/** Full replace — mirrors the old replaceItems()/saveToDisk() semantics. */
export async function replaceItems(db, nextItems) {
  const sanitized = sanitizeNewsItems(nextItems);
  const now = new Date().toISOString();

  const insertStmt = db.prepare(
    `INSERT INTO news_items
       (id, title, excerpt, commentary, canonical_url, published_at, category, source_id, source_name, attribution_label, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const statements = [
    db.prepare('DELETE FROM news_items'),
    ...sanitized.map((item) =>
      insertStmt.bind(
        item.id,
        item.title,
        item.excerpt,
        item.commentary || '',
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
