/**
 * Feed section tabs grouped for mobile "catalog" layout (headings + wrapped chips).
 * IDs must match `FEED_CATEGORIES` in mobile/shared/feed/feedCategories.js.
 */
export const FEED_SECTION_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    categoryIds: ['all'],
  },
  {
    id: 'product',
    label: 'Product & updates',
    categoryIds: ['updates', 'news'],
  },
  {
    id: 'community',
    label: 'Community',
    categoryIds: ['forum', 'community', 'discussion', 'social'],
  },
  {
    id: 'media',
    label: 'Media & guides',
    categoryIds: ['videos', 'tutorials'],
  },
  {
    id: 'work',
    label: 'Engineering',
    categoryIds: ['issues'],
  },
];
