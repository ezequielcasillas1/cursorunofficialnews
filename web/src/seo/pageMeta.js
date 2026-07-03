import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { getPathForCategory, SITE_ORIGIN } from '../routes/feedRoutes.js';

export const DEFAULT_SITE_TITLE = 'Unofficial Cursor News';
export const DEFAULT_DESCRIPTION =
  'Unofficial Cursor news — changelog, releases, and updates. Not affiliated with Anysphere.';

const SECTION_DESCRIPTIONS = {
  updates: 'Cursor changelog, releases, and version updates from official and community sources.',
  news: 'Cursor blog posts and product news from official and community sources.',
  forum: 'Cursor forum discussions and community posts.',
  issues: 'Cursor bug reports and GitHub issues tracked in one feed.',
  community: 'Cursor community posts and fan content.',
  discussion: 'Cursor discussion threads, opinions, and analysis.',
  social: 'Cursor posts from social media and community channels.',
  videos: 'Cursor YouTube videos and video content.',
  tutorials: 'Cursor tutorials, guides, and how-to content.',
};

export function getFeedPageMeta(categoryId) {
  if (!categoryId || categoryId === 'all') {
    return {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: '/',
      breadcrumbLabel: null,
    };
  }

  const cat = FEED_CATEGORIES.find((c) => c.id === categoryId);
  const label = cat?.label ?? categoryId;
  const path = getPathForCategory(categoryId);

  return {
    title: `Cursor ${label} — Unofficial Cursor News`,
    description: SECTION_DESCRIPTIONS[categoryId] ?? `Cursor ${label.toLowerCase()} from unofficial Cursor News.`,
    path,
    breadcrumbLabel: label,
  };
}

export function getStaticPageMeta(pageId) {
  const pages = {
    newsletter: {
      title: 'Newsletter — Unofficial Cursor News',
      description:
        'Subscribe to the Unofficial Cursor News email digest. Members get curated Cursor updates in their inbox.',
      path: '/newsletter',
      breadcrumbLabel: 'Newsletter',
    },
    about: {
      title: 'About — Unofficial Cursor News',
      description:
        'About Unofficial Cursor News — a free fan feed of Cursor changelog, releases, and community sources.',
      path: '/about',
      breadcrumbLabel: 'About',
    },
    sources: {
      title: 'Sources — Unofficial Cursor News',
      description:
        'Human-readable list of ingest sources powering Unofficial Cursor News — official and community feeds.',
      path: '/sources',
      breadcrumbLabel: 'Sources',
    },
  };

  return pages[pageId] ?? {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    breadcrumbLabel: null,
  };
}

export function buildCanonicalUrl(path) {
  if (!path || path === '/') return `${SITE_ORIGIN}/`;
  return `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildBreadcrumbJsonLd(path, breadcrumbLabel) {
  if (!breadcrumbLabel) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${SITE_ORIGIN}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: breadcrumbLabel,
        item: buildCanonicalUrl(path),
      },
    ],
  };
}
