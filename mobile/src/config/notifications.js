import { OFFICIAL_ONLY_TOOLTIP } from '../../shared/feed/sectionTooltips.js';

/** Same label as feed nav — limits digest to verified/primary sources. */
export const NEWSLETTER_OFFICIAL_ONLY = {
  label: 'Official only',
  description: OFFICIAL_ONLY_TOOLTIP,
};

/** Notification topic toggles — maps to registry categories on the API. */
export const NOTIFICATION_CATEGORIES = [
  {
    id: 'changelog',
    label: 'Changelog',
    description: 'Product updates, fixes, and release notes from Cursor.',
  },
  {
    id: 'release',
    label: 'Releases',
    description: 'GitHub release announcements when available.',
  },
  {
    id: 'blog',
    label: 'Blog',
    description: 'Cursor blog posts and editorial news.',
  },
  {
    id: 'forum',
    label: 'Forum',
    description: 'Official forum announcements and community news.',
  },
  {
    id: 'community',
    label: 'Community',
    description: 'Reddit, Hacker News, and other community discussions.',
  },
  {
    id: 'social',
    label: 'Social',
    description: 'Posts from Cursor on X (Twitter).',
  },
  {
    id: 'video',
    label: 'Videos',
    description: 'New uploads on the official Cursor YouTube channel.',
  },
  {
    id: 'tutorial',
    label: 'Tutorials',
    description: 'Cursor Learn, docs, forum guides, and community how-tos.',
  },
];

export const DEFAULT_NOTIFICATION_PREFS = {
  enabled: false,
  categories: ['changelog', 'release', 'blog'],
  officialOnly: false,
};

export const NOTIFICATION_PREFS_KEY = '@cursor_news_notification_prefs';
export const LAST_SEEN_KEY = '@cursor_news_last_seen_at';
