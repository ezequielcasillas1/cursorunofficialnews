export const FEED_PAGE_SIZE = 20;

/** Max items fetched when client-side search is active (API cap is 200). */
export const FEED_SEARCH_FETCH_LIMIT = 200;

/** User-facing feed tabs → registry categories for GET /v1/news?category= */
export const FEED_CATEGORIES = [
  { id: 'all', label: 'All', apiCategories: null },
  { id: 'updates', label: 'Updates', apiCategories: ['changelog', 'release'] },
  { id: 'news', label: 'News', apiCategories: ['blog'] },
  { id: 'forum', label: 'Forum', apiCategories: ['forum'] },
  { id: 'issues', label: 'Issues', apiCategories: ['issue'] },
  { id: 'community', label: 'Community', apiCategories: ['community'] },
  { id: 'discussion', label: 'Discussion', apiCategories: ['discussion'] },
  { id: 'social', label: 'Social', apiCategories: ['social'] },
  { id: 'videos', label: 'Videos', apiCategories: ['video'] },
  { id: 'tutorials', label: 'Tutorials', apiCategories: ['tutorial'] },
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
