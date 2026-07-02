import { buildSubscriberDigestSections } from '../shared/notifications/subscriber-digest.js';
import { getNews } from '../store/news-store.js';
import {
  buildSubscriberForClient,
  getUnsubscribeUrl,
  isSubscriberVerified,
  listSubscribers,
} from '../store/email-subscribers.js';
import { buildSubscriberDigest, fetchRecentItemsForSubscriber } from './newsletter-digest.js';

const DEFAULT_RECENT_LIMIT = 20;

function filterItemsForSubscriber(subscriber, items) {
  if (!subscriber.enabled || !isSubscriberVerified(subscriber)) return [];
  if (!subscriber.categories?.length) return [];
  return buildSubscriberDigestSections(items, subscriber).flatMap((section) => section.items);
}

export async function buildNewsletterExport(db, { newItems = [], recentLimit = DEFAULT_RECENT_LIMIT } = {}, env) {
  const { items: recentItems } = await getNews(db, { limit: recentLimit, offset: 0 });

  const allSubscribers = await listSubscribers(db);
  const subscribers = await Promise.all(
    allSubscribers
      .filter((subscriber) => subscriber.enabled && isSubscriberVerified(subscriber))
      .map(async (subscriber) => {
        const perCategoryRecent = await fetchRecentItemsForSubscriber(db, subscriber);
        const matchingNewItems = filterItemsForSubscriber(subscriber, newItems);
        const matchingRecentItems = filterItemsForSubscriber(subscriber, perCategoryRecent);
        const digestSections = buildSubscriberDigestSections(
          newItems.length ? [...newItems, ...perCategoryRecent] : perCategoryRecent,
          subscriber,
        );

        return {
          ...buildSubscriberForClient(subscriber),
          unsubscribeUrl: getUnsubscribeUrl(subscriber, env),
          matchingNewItems,
          matchingRecentItems,
          digestSections,
          dividerCount: Math.max(0, digestSections.length - 1),
        };
      }),
  );

  return {
    generatedAt: new Date().toISOString(),
    subscriberCount: subscribers.length,
    newItemCount: newItems.length,
    subscribers,
    recentItems,
    newItems,
  };
}

export { buildSubscriberDigest };
