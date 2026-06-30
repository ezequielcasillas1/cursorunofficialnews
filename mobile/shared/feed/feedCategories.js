import { OFFICIAL_ONLY_TOOLTIP, SECTION_TOOLTIPS } from './sectionTooltips.js';

export { OFFICIAL_ONLY_TOOLTIP };

/**
 * User-facing feed tabs → registry/API categories for GET /v1/news?category=
 * Each tab maps to one or more source registry categories from ingest.
 */
export const FEED_CATEGORIES = [
  { id: 'all', label: 'All', apiCategories: null, tooltip: SECTION_TOOLTIPS.all },
  {
    id: 'updates',
    label: 'Updates',
    apiCategories: ['changelog', 'release'],
    tooltip: SECTION_TOOLTIPS.updates,
  },
  { id: 'news', label: 'News', apiCategories: ['blog'], tooltip: SECTION_TOOLTIPS.news },
  { id: 'forum', label: 'Forum', apiCategories: ['forum'], tooltip: SECTION_TOOLTIPS.forum },
  { id: 'issues', label: 'Issues', apiCategories: ['issue'], tooltip: SECTION_TOOLTIPS.issues },
  {
    id: 'community',
    label: 'Community',
    apiCategories: ['community'],
    tooltip: SECTION_TOOLTIPS.community,
  },
  {
    id: 'discussion',
    label: 'Discussion',
    apiCategories: ['discussion'],
    tooltip: SECTION_TOOLTIPS.discussion,
  },
  { id: 'social', label: 'Social', apiCategories: ['social'], tooltip: SECTION_TOOLTIPS.social },
  { id: 'videos', label: 'Videos', apiCategories: ['video'], tooltip: SECTION_TOOLTIPS.videos },
  {
    id: 'tutorials',
    label: 'Tutorials',
    apiCategories: ['tutorial'],
    tooltip: SECTION_TOOLTIPS.tutorials,
  },
];

export function getCategoryApiParam(categoryId) {
  const cat = FEED_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat?.apiCategories?.length) return undefined;
  return cat.apiCategories.join(',');
}

export function getEmptyFeedMessage(categoryId, officialOnly) {
  const messages = {
    all: 'No items yet. Refresh the feed to run ingest.',
    updates: 'No changelog or release items found.',
    news: 'No blog posts found.',
    forum: 'No forum posts found.',
    issues: 'No bug or issue reports right now.',
    community: 'No community posts found.',
    discussion: 'No discussion or opinion posts found.',
    social: 'No social posts found.',
    videos: 'No YouTube videos found.',
    tutorials: 'No tutorials found yet. Try Refresh.',
  };
  let message = messages[categoryId] || messages.all;
  if (officialOnly) {
    message += ' Try turning off Official only.';
  }
  return message;
}
