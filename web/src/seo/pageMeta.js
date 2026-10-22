import {
  buildCanonicalUrl,
  itemPublicPath,
  normalizePublicPath,
  SITE_ORIGIN,
} from '../../../mobile/shared/seo/publicPaths.js';
import { FEED_CATEGORIES } from '../config/feedCategories.js';
import { getPathForCategory } from '../routes/feedRoutes.js';

export { buildCanonicalUrl, SITE_ORIGIN };

/** Visible brand in chrome, emails, and inner-page title suffixes. */
export const SITE_BRAND = 'Unofficial Cursor News';

/** Homepage <title> — lead with the Google query "cursor news". */
export const DEFAULT_SITE_TITLE = 'Cursor News — Unofficial Changelog, Releases & Updates';
export const DEFAULT_DESCRIPTION =
  'Cursor news — unofficial feed of changelog, releases, blog posts, and community updates. Independent fan site, not affiliated with Anysphere.';

export const OG_IMAGE_PATH = '/brand/og-image.png';
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

const SECTION_DESCRIPTIONS = {
  updates: 'Cursor changelog, releases, and Grok / xAI / SpaceX news after the SpaceXAI acquisition. Unofficial fan feed, not affiliated with Anysphere.',
  news: 'Cursor blog posts and product news from official and community sources.',
  forum: 'Cursor forum discussions and community posts.',
  issues: 'Cursor bug reports and GitHub issues tracked in one feed.',
  community: 'Cursor community posts and fan content.',
  discussion: 'Cursor discussion threads, opinions, and analysis.',
  social: 'Posts from Cursor, xAI, Grok, and SpaceX on X.',
  videos: 'Cursor YouTube videos and video content.',
  tutorials: 'Cursor tutorials, guides, and how-to content.',
};

/** Keep /news from cannibalizing the homepage for the query "cursor news". */
const SECTION_TITLES = {
  news: `Cursor Blog & Product News — ${SITE_BRAND}`,
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
    title: SECTION_TITLES[categoryId] ?? `Cursor ${label} — ${SITE_BRAND}`,
    description: SECTION_DESCRIPTIONS[categoryId] ?? `Cursor ${label.toLowerCase()} from unofficial Cursor News.`,
    path: normalizePublicPath(path),
    breadcrumbLabel: label,
  };
}

export function getStaticPageMeta(pageId) {
  const pages = {
    newsletter: {
      title: `Newsletter — ${SITE_BRAND}`,
      description:
        'Subscribe to the Unofficial Cursor News email digest — curated Cursor updates in your inbox.',
      path: '/newsletter/',
      breadcrumbLabel: 'Newsletter',
    },
    newsletterUnsubscribe: {
      title: `Unsubscribe — ${SITE_BRAND}`,
      description:
        'Unsubscribe from the Unofficial Cursor News email digest. Stop curated Cursor updates in your inbox anytime.',
      path: '/newsletter/unsubscribe/',
      breadcrumbLabel: 'Unsubscribe',
    },
    games: {
      title: `Games — ${SITE_BRAND}`,
      description:
        'Cursor-themed browser games from Unofficial Cursor News — logo pieces, Git puns, and Commit Chess.',
      path: '/games/',
      breadcrumbLabel: 'Games',
    },
    about: {
      title: `About Cursor News — ${SITE_BRAND}`,
      description:
        'About this Cursor news feed — including Grok / xAI / SpaceX after the SpaceXAI acquisition. Independent fan site, not affiliated with Anysphere.',
      path: '/about/',
      breadcrumbLabel: 'About',
    },
    editorialPolicy: {
      title: `Editorial Policy — ${SITE_BRAND}`,
      description:
        'How Unofficial Cursor News sources stories, writes original commentary, attributes publishers, and links out — never full-article republishing.',
      path: '/editorial-policy/',
      breadcrumbLabel: 'Editorial Policy',
    },
    sources: {
      title: `Sources — ${SITE_BRAND}`,
      description:
        'Human-readable list of ingest sources powering Unofficial Cursor News — official and community feeds.',
      path: '/sources/',
      breadcrumbLabel: 'Sources',
    },
    privacy: {
      title: `Privacy Policy — ${SITE_BRAND}`,
      description:
        'Privacy Policy for Unofficial Cursor News — how we handle newsletter and site data.',
      path: '/privacy/',
      breadcrumbLabel: 'Privacy',
    },
    terms: {
      title: `Terms of Use — ${SITE_BRAND}`,
      description:
        'Terms of Use for Unofficial Cursor News — rules for using this unofficial fan news feed.',
      path: '/terms/',
      breadcrumbLabel: 'Terms',
    },
  };

  const page = pages[pageId];
  if (!page) {
    return {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_DESCRIPTION,
      path: '/',
      breadcrumbLabel: null,
    };
  }
  return { ...page, path: normalizePublicPath(page.path) };
}

export function getGamePageMeta(game) {
  if (!game?.id) {
    return getStaticPageMeta('games');
  }
  return {
    title: `${game.title} — ${SITE_BRAND}`,
    description: game.blurb || getStaticPageMeta('games').description,
    path: game.path || `/games/${game.id}`,
    breadcrumbLabel: game.title,
  };
}

export function getArticlePageMeta(item) {
  if (!item?.id) {
    return {
      title: `Story — ${SITE_BRAND}`,
      description: DEFAULT_DESCRIPTION,
      path: '/',
      breadcrumbLabel: 'Story',
    };
  }

  const path = itemPublicPath(item.id);
  const description =
    (item.commentary && String(item.commentary).replace(/\s+/g, ' ').trim().slice(0, 160)) ||
    (item.excerpt && String(item.excerpt).trim().slice(0, 160)) ||
    DEFAULT_DESCRIPTION;

  return {
    title: `${item.title} — ${SITE_BRAND}`,
    description,
    path,
    breadcrumbLabel: item.title,
  };
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
        name: 'Cursor News',
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

const ORGANIZATION_NODE = {
  '@type': 'Organization',
  '@id': `${SITE_ORIGIN}/#organization`,
  name: SITE_BRAND,
  alternateName: 'Cursor News',
  url: `${SITE_ORIGIN}/`,
  logo: {
    '@type': 'ImageObject',
    '@id': `${SITE_ORIGIN}/#logo`,
    url: `${SITE_ORIGIN}/brand/logo-icon.png`,
    contentUrl: `${SITE_ORIGIN}/brand/logo-icon.png`,
    width: 512,
    height: 512,
    caption: 'Cursor News',
  },
};

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: `${SITE_ORIGIN}/`,
        name: 'Cursor News',
        alternateName: ['Unofficial Cursor News', 'Unofficial Cursor news'],
        description: DEFAULT_DESCRIPTION,
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        inLanguage: 'en',
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_ORIGIN}/#webpage`,
        url: `${SITE_ORIGIN}/`,
        name: DEFAULT_SITE_TITLE,
        description: DEFAULT_DESCRIPTION,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        about: {
          '@type': 'SoftwareApplication',
          name: 'Cursor',
          applicationCategory: 'DeveloperApplication',
        },
        inLanguage: 'en',
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      },
      ORGANIZATION_NODE,
    ],
  };
}

export function buildPageJsonLd({ title, description, path, breadcrumbLabel }) {
  if (!path || path === '/') return buildWebsiteJsonLd();

  const graph = [
    {
      '@type': 'WebPage',
      '@id': `${buildCanonicalUrl(path)}#webpage`,
      url: buildCanonicalUrl(path),
      name: title,
      description,
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      inLanguage: 'en',
    },
    ORGANIZATION_NODE,
  ];

  const crumbs = buildBreadcrumbJsonLd(path, breadcrumbLabel);
  if (crumbs) {
    graph.push({
      '@type': crumbs['@type'],
      itemListElement: crumbs.itemListElement,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}
