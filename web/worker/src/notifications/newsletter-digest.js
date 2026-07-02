import {
  flattenDigestSections,
  normalizeCategoryLimits,
} from '../shared/notifications/category-limits.js';
import { buildSubscriberDigestSections } from '../shared/notifications/subscriber-digest.js';
import { CATEGORY_LABELS } from '../shared/notifications/constants.js';
import { assembleEmailDigest } from './assemble-email.js';
import { getNews } from '../store/news-store.js';
import { getUnsubscribeUrl } from '../store/email-subscribers.js';

const DEFAULT_PER_CATEGORY_FETCH = 3;

function serializeSection(section) {
  return {
    categoryId: section.categoryId,
    label: CATEGORY_LABELS[section.categoryId] || section.categoryId,
    count: section.items.length,
    items: section.items,
  };
}

/**
 * Fetch enough recent items per enabled category so headline limits (1–3) can be applied.
 */
export async function fetchRecentItemsForSubscriber(db, subscriber) {
  if (!subscriber?.categories?.length) return [];

  const limits = normalizeCategoryLimits(subscriber.categoryLimits, subscriber.categories);
  const perCategoryLimit = Math.max(
    DEFAULT_PER_CATEGORY_FETCH,
    ...Object.values(limits),
  );

  const results = await Promise.all(
    subscriber.categories.map((category) =>
      getNews(db, { category, limit: perCategoryLimit, offset: 0 }),
    ),
  );

  const seen = new Set();
  const merged = [];
  for (const { items } of results) {
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
    }
  }
  return merged;
}

export async function buildSubscriberDigest(
  db,
  subscriber,
  { newItems = [], preferNewItems = true } = {},
  env,
) {
  const recentItems = await fetchRecentItemsForSubscriber(db, subscriber);
  const sourceItems =
    preferNewItems && newItems.length
      ? [...newItems, ...recentItems]
      : recentItems;

  const sections = buildSubscriberDigestSections(sourceItems, subscriber);
  const items = flattenDigestSections(sections);
  const unsubscribeUrl = getUnsubscribeUrl(subscriber, env);
  const digest = assembleEmailDigest({ sections }, { unsubscribeUrl });

  return {
    sections: sections.map(serializeSection),
    items,
    ...digest,
  };
}
