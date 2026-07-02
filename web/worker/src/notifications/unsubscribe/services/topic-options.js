import { NOTIFICATION_CATEGORIES } from '../../../shared/notifications/topics.js';
import { renderTopicRow } from '../components/topic-row.js';
import { getCategoryLimit } from './limit-options.js';

export function buildTopicRowData(category, defaultCategories, categoryLimits = {}) {
  return {
    category,
    checked: defaultCategories.includes(category.id),
    limit: getCategoryLimit(category.id, categoryLimits),
  };
}

export function buildTopicRowsHtml(defaultCategories, categoryLimits = {}) {
  return NOTIFICATION_CATEGORIES.map((category) => {
    const { checked, limit } = buildTopicRowData(
      category,
      defaultCategories,
      categoryLimits,
    );
    return renderTopicRow(category, { checked, limit });
  }).join('\n');
}

export { MAX_CATEGORY_ITEM_LIMIT } from './limit-options.js';
