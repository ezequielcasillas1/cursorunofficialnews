export const MIN_CATEGORY_ITEM_LIMIT = 1;
export const MAX_CATEGORY_ITEM_LIMIT = 3;
export const DEFAULT_CATEGORY_ITEM_LIMIT = 1;

/** Stable section order for email digests (matches app topic list). */
export const DIGEST_CATEGORY_ORDER = [
  'changelog',
  'release',
  'blog',
  'forum',
  'community',
  'social',
  'video',
  'tutorial',
];

function sortItemsByDateDesc(items) {
  return [...items].sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}

export function clampCategoryLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_CATEGORY_ITEM_LIMIT;
  return Math.min(
    MAX_CATEGORY_ITEM_LIMIT,
    Math.max(MIN_CATEGORY_ITEM_LIMIT, Math.floor(parsed)),
  );
}

/** Keep only enabled categories; clamp each limit to 1–3. */
export function normalizeCategoryLimits(categoryLimits, categories = []) {
  const enabled = Array.isArray(categories) ? categories : [];
  const source =
    categoryLimits && typeof categoryLimits === 'object' && !Array.isArray(categoryLimits)
      ? categoryLimits
      : {};
  const result = {};
  for (const categoryId of enabled) {
    result[categoryId] = clampCategoryLimit(source[categoryId]);
  }
  return result;
}

export function filterItemsBySubscriberCategories(items, subscriber) {
  if (!subscriber?.categories?.length) return [];
  return (items || []).filter((item) => subscriber.categories.includes(item.category));
}

/**
 * Build digest sections: enabled topics only, top 1–3 newest per category,
 * ordered like the app settings list.
 */
export function buildDigestSections(items, subscriber) {
  if (!subscriber?.categories?.length) return [];

  const enabled = new Set(subscriber.categories);
  const limits = normalizeCategoryLimits(subscriber.categoryLimits, subscriber.categories);
  const byCategory = new Map();

  for (const item of items || []) {
    if (!enabled.has(item.category)) continue;
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  const sections = [];
  for (const categoryId of DIGEST_CATEGORY_ORDER) {
    if (!enabled.has(categoryId)) continue;
    const catItems = byCategory.get(categoryId);
    if (!catItems?.length) continue;

    const limit = limits[categoryId] ?? DEFAULT_CATEGORY_ITEM_LIMIT;
    sections.push({
      categoryId,
      items: sortItemsByDateDesc(catItems).slice(0, limit),
    });
  }

  return sections;
}

export function flattenDigestSections(sections) {
  return (sections || []).flatMap((section) => section.items || []);
}

/** Apply per-category item caps (newest first within each category). */
export function applyCategoryLimits(items, subscriber) {
  return flattenDigestSections(buildDigestSections(items, subscriber));
}
