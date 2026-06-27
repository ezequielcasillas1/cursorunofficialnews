export const SOURCES = [
  {
    id: 'cursor-changelog-rss',
    name: 'Cursor Changelog',
    category: 'changelog',
    feedUrl: 'https://cursor.com/changelog/rss.xml',
    ingestMethod: 'rss',
    enabled: true,
    priority: 1,
    isOfficial: true,
    maxExcerptChars: 300,
    attributionLabel: 'Cursor',
  },
  {
    id: 'cursor-github-releases',
    name: 'Cursor GitHub Releases',
    category: 'release',
    feedUrl: 'https://github.com/getcursor/cursor/releases.atom',
    ingestMethod: 'atom',
    enabled: true,
    priority: 2,
    isOfficial: true,
    maxExcerptChars: 300,
    attributionLabel: 'GitHub',
  },
  {
    id: 'cursor-forum-announcements',
    name: 'Cursor Forum — Announcements',
    category: 'forum',
    feedUrl: 'https://forum.cursor.com/c/announcements/10.rss',
    ingestMethod: 'rss',
    enabled: true,
    priority: 10,
    isOfficial: false,
    maxExcerptChars: 300,
    attributionLabel: 'Cursor Forum',
  },
  {
    id: 'cursor-youtube-official',
    name: 'Cursor YouTube',
    category: 'video',
    feedUrl:
      'https://www.youtube.com/feeds/videos.xml?channel_id=UC6YYHJzM6PhZ2Yey9BQiUaw',
    ingestMethod: 'rss',
    enabled: true,
    priority: 5,
    isOfficial: true,
    maxExcerptChars: 300,
    attributionLabel: 'Cursor',
  },
  {
    id: 'cursor-blog-scrape',
    name: 'Cursor Blog',
    category: 'blog',
    pageUrl: 'https://cursor.com/blog',
    ingestMethod: 'scrape',
    enabled: true,
    priority: 20,
    isOfficial: true,
    maxExcerptChars: 300,
    attributionLabel: 'Cursor',
  },
  {
    id: 'cursor-learn-tutorials',
    name: 'Cursor Learn — Tutorials',
    category: 'tutorial',
    sitemapUrl: 'https://cursor.com/docs/sitemap.xml',
    urlPattern: /^https:\/\/cursor\.com\/learn\//,
    skipPattern: /\/page\.mdx$/,
    ingestMethod: 'sitemap',
    enabled: true,
    priority: 6,
    isOfficial: true,
    maxExcerptChars: 300,
    attributionLabel: 'Cursor',
  },
  {
    id: 'releasebot-cursor',
    name: 'Releasebot — Cursor Updates',
    category: 'release',
    pageUrl: 'https://releasebot.io/updates/cursor',
    ingestMethod: 'scrape',
    enabled: false,
    priority: 50,
    isOfficial: false,
    maxExcerptChars: 300,
    attributionLabel: 'Releasebot',
  },
];

export function listSources() {
  return SOURCES.filter((s) => s.enabled);
}

export function getSourceById(id) {
  return SOURCES.find((s) => s.id === id) || null;
}

export function getSourceMeta(id) {
  const source = getSourceById(id);
  if (!source) return null;
  return {
    priority: source.priority,
    isOfficial: source.isOfficial ?? false,
  };
}

export function listSourcesForApi() {
  return SOURCES.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    ingestMethod: s.ingestMethod,
    enabled: s.enabled,
    priority: s.priority,
    isOfficial: s.isOfficial ?? false,
    maxExcerptChars: s.maxExcerptChars,
    attributionLabel: s.attributionLabel,
    feedUrl: s.feedUrl || null,
    pageUrl: s.pageUrl || null,
    sitemapUrl: s.sitemapUrl || null,
  }));
}