import { getSourceById, getSourceMeta } from '../sources/registry.js';
import { loadJsonFile, saveJsonFile } from './json-persist.js';
import { sanitizeExternalUrl } from '../../../shared/url/safe-external-url.js';

const FILENAME = 'news-cache.json';

let items = [];
let lastIngestAt = null;

function sanitizeNewsItem(item) {
  if (!item || typeof item !== 'object') return null;
  const source = item.sourceId ? getSourceById(item.sourceId) : null;
  // Sitemap-sourced items inherit <lastmod>, which is the sitemap's own
  // regeneration time — not the article date. Drop it so evergreen tutorials
  // cannot pose as today's news in the chronological All feed.
  const publishedAt =
    source?.ingestMethod === 'sitemap' ? null : item.publishedAt;
  return {
    ...item,
    category: source?.category || item.category,
    canonicalUrl: sanitizeExternalUrl(item.canonicalUrl),
    publishedAt,
  };
}

function sanitizeNewsItems(nextItems) {
  if (!Array.isArray(nextItems)) return [];
  return nextItems.map(sanitizeNewsItem).filter(Boolean);
}

function loadFromDisk() {
  const data = loadJsonFile(FILENAME, { items: [], lastIngestAt: null });
  const rawItems = Array.isArray(data.items) ? data.items : [];
  items = sanitizeNewsItems(rawItems);
  lastIngestAt = data.lastIngestAt || null;
  if (items.length !== rawItems.length || JSON.stringify(items) !== JSON.stringify(rawItems)) {
    saveToDisk();
  }
}

function saveToDisk() {
  saveJsonFile(FILENAME, { items, lastIngestAt });
}

loadFromDisk();

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
function diversifyBySource(list, limit) {
  if (list.length <= limit) return sortByDateDesc(list);

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
  while (result.length < limit && progress) {
    progress = false;
    for (const sourceId of sourceIds) {
      const bucket = bySource.get(sourceId);
      const i = cursor[sourceId];
      if (i < bucket.length && result.length < limit) {
        result.push(bucket[i]);
        cursor[sourceId] = i + 1;
        progress = true;
      }
    }
  }
  return result;
}

export function getNews({ category, categories, official, limit = 50 } = {}) {
  let list = [...items];
  const categoryList = parseCategories({ category, categories });
  if (categoryList.length > 0) {
    const set = new Set(categoryList);
    list = list.filter((item) => set.has(item.category));
  }
  const officialOnly = official === true || official === 'true';
  if (officialOnly) {
    list = list.filter((item) => getSourceMeta(item.sourceId)?.isOfficial);
    return sortByDateDesc(list).slice(0, limit);
  }
  // All sections: chronological timeline so tutorials sit at their real dates.
  if (categoryList.length === 0) {
    return sortByDateDesc(list).slice(0, limit);
  }
  return diversifyBySource(list, limit);
}

export function replaceItems(nextItems) {
  items = sanitizeNewsItems(nextItems);
  saveToDisk();
}

export function setLastIngestAt(iso) {
  lastIngestAt = iso;
  saveToDisk();
}

export function getLastIngestAt() {
  return lastIngestAt;
}

export function getStatus() {
  return {
    itemCount: items.length,
    lastIngestAt,
  };
}
