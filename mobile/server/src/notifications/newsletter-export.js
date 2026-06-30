import { applyCategoryLimits } from '../../../shared/notifications/category-limits.js';
import { getNews } from '../store/memory-cache.js';
import {
  buildSubscriberForClient,
  getUnsubscribeUrl,
  isSubscriberVerified,
  listSubscribers,
} from '../store/email-subscribers.js';

const DEFAULT_RECENT_LIMIT = 20;

function filterItemsForSubscriber(subscriber, items) {
  if (!subscriber.enabled || !isSubscriberVerified(subscriber)) return [];
  if (!subscriber.categories?.length) return [];
  return applyCategoryLimits(items, subscriber);
}

export function buildNewsletterExport({ newItems = [], recentLimit = DEFAULT_RECENT_LIMIT } = {}) {
  const { items: recentItems } = getNews({ limit: recentLimit, offset: 0 });

  const subscribers = listSubscribers()
    .filter((subscriber) => subscriber.enabled && isSubscriberVerified(subscriber))
    .map((subscriber) => ({
      ...buildSubscriberForClient(subscriber),
      unsubscribeUrl: getUnsubscribeUrl(subscriber),
      matchingNewItems: filterItemsForSubscriber(subscriber, newItems),
      matchingRecentItems: filterItemsForSubscriber(subscriber, recentItems),
    }));

  return {
    generatedAt: new Date().toISOString(),
    subscriberCount: subscribers.length,
    newItemCount: newItems.length,
    subscribers,
    recentItems,
    newItems,
  };
}
