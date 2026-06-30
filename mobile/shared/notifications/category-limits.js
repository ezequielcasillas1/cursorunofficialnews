export const MIN_CATEGORY_ITEM_LIMIT = 1;
export const MAX_CATEGORY_ITEM_LIMIT = 3;
export const DEFAULT_CATEGORY_ITEM_LIMIT = 1;

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

/** Apply per-category item caps (newest first within each category). */
export function applyCategoryLimits(items, subscriber) {
  const filtered = filterItemsBySubscriberCategories(items, subscriber);
  const limits = normalizeCategoryLimits(
    subscriber?.categoryLimits,
    subscriber?.categories,
  );

  const byCategory = new Map();
  for (const item of filtered) {
    const cat = item.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(item);
  }

  const result = [];
  for (const [categoryId, catItems] of byCategory) {
    const limit = limits[categoryId] ?? DEFAULT_CATEGORY_ITEM_LIMIT;
    const sorted = [...catItems].sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return tb - ta;
    });
    result.push(...sorted.slice(0, limit));
  }

  return result.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
}
