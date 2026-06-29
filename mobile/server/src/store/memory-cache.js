import { getSourceById, getSourceMeta } from '../sources/registry.js';
import { loadJsonFile, saveJsonFile } from './json-persist.js';
import { sanitizeExternalUrl } from '../../../shared/url/safe-external-url.js';

const FILENAME = 'news-cache.json';

let items = [];
let lastIngestAt = null;

function sanitizeNewsItem(item) {
  if (!item || typeof item !== 'object') return null;
  const source = item.sourceId ? getSourceById(item.sourceId) : null;
  return {
    ...item,
    category: source?.category || item.category,
    canonicalUrl: sanitizeExternalUrl(item.canonicalUrl),
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

export function getNews({ category, categories, official, limit = 50 } = {}) {
  let list = [...items];
  const categoryList = parseCategories({ category, categories });
  if (categoryList.length > 0) {
    const set = new Set(categoryList);
    list = list.filter((item) => set.has(item.category));
  }
  if (official === true || official === 'true') {
    list = list.filter((item) => getSourceMeta(item.sourceId)?.isOfficial);
  }
  list.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  return list.slice(0, limit);
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
