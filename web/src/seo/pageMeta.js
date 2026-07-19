import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { getPathForCategory, SITE_ORIGIN } from '../routes/feedRoutes.js';

export const DEFAULT_SITE_TITLE = 'Unofficial Cursor News';
export const DEFAULT_DESCRIPTION =
  'Unofficial Cursor news — changelog, releases, and updates. Not affiliated with Anysphere.';

export const OG_IMAGE_PATH = '/brand/og-image.png';
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const SECTION_DESCRIPTIONS = {
  updates: 'Cursor changelog, releases, and version updates from official and community sources.',
  news: 'Cursor blog posts and product news from official and community sources.',
  forum: 'Cursor forum discussions and community posts.',
  issues: 'Cursor bug reports and GitHub issues tracked in one feed.',
  community: 'Cursor community posts and fan content.',
  discussion: 'Cursor discussion threads, opinions, and analysis.',
  social: 'Posts from Cursor on X (Twitter).',
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
    newsletterUnsubscribe: {
      title: 'Unsubscribe — Unofficial Cursor News',
      description:
        'Unsubscribe from the Unofficial Cursor News email digest. Stop curated Cursor updates in your inbox anytime.',
      path: '/newsletter/unsubscribe',
      breadcrumbLabel: 'Unsubscribe',
    },
    membershipUnsubscribe: {
      title: 'Cancel membership — Unofficial Cursor News',
      description:
        'Cancel your Unofficial Cursor News monthly membership. Stop Stripe billing while keeping access until period end.',
      path: '/membership/unsubscribe',
      breadcrumbLabel: 'Cancel membership',
    },
    games: {
      title: 'Games — Unofficial Cursor News',
      description:
        'Cursor-themed browser games from Unofficial Cursor News — logo pieces, Git puns, and Commit Chess.',
      path: '/games',
      breadcrumbLabel: 'Games',
    },
    about: {
      title: 'About — Unofficial Cursor News',
      description:
        'About Unofficial Cursor News — an independent fan publication covering Cursor changelogs, releases, and community sources with original notes.',
      path: '/about',
      breadcrumbLabel: 'About',
    },
    editorialPolicy: {
      title: 'Editorial Policy — Unofficial Cursor News',
      description:
        'How Unofficial Cursor News sources stories, writes original commentary, attributes publishers, and links out — never full-article republishing.',
      path: '/editorial-policy',
      breadcrumbLabel: 'Editorial Policy',
    },
    sources: {
      title: 'Sources — Unofficial Cursor News',
      description:
        'Human-readable list of ingest sources powering Unofficial Cursor News — official and community feeds.',
      path: '/sources',
      breadcrumbLabel: 'Sources',
    },
    privacy: {
      title: 'Privacy Policy — Unofficial Cursor News',
      description:
        'Privacy Policy for Unofficial Cursor News — how we handle newsletter, membership, and site data.',
      path: '/privacy',
      breadcrumbLabel: 'Privacy',
    },
    terms: {
      title: 'Terms of Use — Unofficial Cursor News',
      description:
        'Terms of Use for Unofficial Cursor News — rules for using this unofficial fan news feed and membership.',
      path: '/terms',
      breadcrumbLabel: 'Terms',
    },
  };

  return pages[pageId] ?? {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_DESCRIPTION,
    path: '/',
    breadcrumbLabel: null,
  };
}

export function getGamePageMeta(game) {
  if (!game?.id) {
    return getStaticPageMeta('games');
  }
  return {
    title: `${game.title} — Unofficial Cursor News`,
    description: game.blurb || getStaticPageMeta('games').description,
    path: game.path || `/games/${game.id}`,
    breadcrumbLabel: game.title,
  };
}

export function getArticlePageMeta(item) {
  if (!item?.id) {
    return {
      title: `Story — ${DEFAULT_SITE_TITLE}`,
      description: DEFAULT_DESCRIPTION,
      path: '/',
      breadcrumbLabel: 'Story',
    };
  }

  const path = `/item/${encodeURIComponent(item.id)}`;
  const description =
    (item.commentary && String(item.commentary).replace(/\s+/g, ' ').trim().slice(0, 160)) ||
    (item.excerpt && String(item.excerpt).trim().slice(0, 160)) ||
    DEFAULT_DESCRIPTION;

  return {
    title: `${item.title} — Unofficial Cursor News`,
    description,
    path,
    breadcrumbLabel: item.title,
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
