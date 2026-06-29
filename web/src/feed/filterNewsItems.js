import { formatCategoryLabel } from '../utils/articleMedia.js';

function normalizeQuery(query) {
  return String(query || '').trim().toLowerCase();
}

function itemSearchText(item) {
  const parts = [
    item.title,
    item.excerpt,
    item.category,
    formatCategoryLabel(item.category),
    item.sourceName,
    item.attributionLabel,
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

/** Client-side filter for loaded feed items (letters / news cards). */
export function filterNewsItems(items, query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return items;

  return items.filter((item) => itemSearchText(item).includes(normalized));
}
