import { applyCategoryLimits } from '../shared/notifications/category-limits.js';
import { getNews } from '../store/news-store.js';
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

export async function buildNewsletterExport(db, { newItems = [], recentLimit = DEFAULT_RECENT_LIMIT } = {}, env) {
  const { items: recentItems } = await getNews(db, { limit: recentLimit, offset: 0 });

  const allSubscribers = await listSubscribers(db);
  const subscribers = allSubscribers
    .filter((subscriber) => subscriber.enabled && isSubscriberVerified(subscriber))
    .map((subscriber) => ({
      ...buildSubscriberForClient(subscriber),
      unsubscribeUrl: getUnsubscribeUrl(subscriber, env),
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
