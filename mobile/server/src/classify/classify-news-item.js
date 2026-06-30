import { getSourceById } from '../sources/registry.js';
import {
  classifyByContent,
  CONTENT_CLASSIFIED_SOURCE_IDS,
  LOCKED_SOURCE_CATEGORIES,
} from './content-signals.js';
import { categoryFromUrl } from './url-rules.js';

/**
 * Resolve the feed category for a news item.
 * URL rules beat registry defaults; content heuristics refine ambiguous third-party feeds.
 */
export function classifyNewsItem(item, source = null) {
  if (!item || typeof item !== 'object') return item?.category || 'community';

  const resolvedSource = source || (item.sourceId ? getSourceById(item.sourceId) : null);
  const registryCategory = resolvedSource?.category || item.category || 'community';
  const url = item.canonicalUrl || '';

  const urlCategory = categoryFromUrl(url);
  if (urlCategory) return urlCategory;

  if (resolvedSource?.id && LOCKED_SOURCE_CATEGORIES.has(resolvedSource.id)) {
    return registryCategory;
  }

  if (
    resolvedSource?.id &&
    CONTENT_CLASSIFIED_SOURCE_IDS.has(resolvedSource.id)
  ) {
    const contentCategory = classifyByContent({
      title: item.title,
      excerpt: item.excerpt,
      sourceCategory: registryCategory,
    });
    if (contentCategory) return contentCategory;
    // Tag feeds (dev.to, medium) are tutorial-hinted in registry — default ambiguous items to community.
    if (registryCategory === 'tutorial') return 'community';
  }

  return registryCategory;
}

export function applyCategoryClassification(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    category: classifyNewsItem(item),
  };
}
