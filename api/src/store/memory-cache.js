import { getSourceMeta } from '../sources/registry.js';

let items = [];
let lastIngestAt = null;

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
  items = nextItems;
}

export function setLastIngestAt(iso) {
  lastIngestAt = iso;
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