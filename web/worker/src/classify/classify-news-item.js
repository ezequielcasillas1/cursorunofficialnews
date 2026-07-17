import { getSourceById } from '../sources/registry.js';
import {
  classifyByContent,
  CONTENT_CLASSIFIED_SOURCE_IDS,
  DISCUSSION_PROMOTABLE_BASES,
  discussionScore,
  ISSUE_PROMOTABLE_BASES,
  issueScore,
  LOCKED_SOURCE_CATEGORIES,
} from './content-signals.js';
import { categoryFromUrl } from './url-rules.js';

const ISSUE_PROMOTE_THRESHOLD = 3;
const DISCUSSION_PROMOTE_THRESHOLD = 2;

function baseCategory(item, resolvedSource) {
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
    // Keep tutorial/community registry feeds on their tabs unless content
    // rules explicitly reclassified them (question → community, how-to → tutorial).
    if (registryCategory === 'tutorial' || registryCategory === 'community') {
      return registryCategory;
    }
  }

  return registryCategory;
}

/**
 * Resolve the feed category for a news item.
 * Layered: URL rules → registry/content base → issue/discussion override.
 */
export function classifyNewsItem(item, source = null) {
  if (!item || typeof item !== 'object') return item?.category || 'community';

  const resolvedSource = source || (item.sourceId ? getSourceById(item.sourceId) : null);
  const base = baseCategory(item, resolvedSource);
  const { title, excerpt } = item;

  // Community registry feeds stay on the Community tab (chips filter by
  // category=community). Issue/discussion promotion still applies elsewhere.
  if (resolvedSource?.category === 'community') {
    return 'community';
  }

  if (ISSUE_PROMOTABLE_BASES.has(base)) {
    if (issueScore(title, excerpt) >= ISSUE_PROMOTE_THRESHOLD) return 'issue';
  }

  if (DISCUSSION_PROMOTABLE_BASES.has(base)) {
    if (discussionScore(title, excerpt) >= DISCUSSION_PROMOTE_THRESHOLD) return 'discussion';
  }

  return base;
}

export function applyCategoryClassification(item) {
  if (!item || typeof item !== 'object') return item;
  return {
    ...item,
    category: classifyNewsItem(item),
  };
}
