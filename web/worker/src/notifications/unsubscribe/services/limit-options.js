import {
  DEFAULT_CATEGORY_ITEM_LIMIT,
  MAX_CATEGORY_ITEM_LIMIT,
  MIN_CATEGORY_ITEM_LIMIT,
} from '../../../shared/notifications/category-limits.js';

export function buildLimitOptions(selectedLimit) {
  return Array.from(
    { length: MAX_CATEGORY_ITEM_LIMIT - MIN_CATEGORY_ITEM_LIMIT + 1 },
    (_, index) => MIN_CATEGORY_ITEM_LIMIT + index,
  )
    .map(
      (count) =>
        `<option value="${count}"${count === selectedLimit ? ' selected' : ''}>${count}</option>`,
    )
    .join('');
}

export function getCategoryLimit(categoryId, categoryLimits = {}) {
  return categoryLimits[categoryId] ?? DEFAULT_CATEGORY_ITEM_LIMIT;
}

export { MAX_CATEGORY_ITEM_LIMIT };
