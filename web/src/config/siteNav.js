import { normalizePublicPath } from '../../../mobile/shared/seo/publicPaths.js';

/** Site header/footer nav links and tooltip copy — shared across masthead and footer. */

export const FEED_SECTION_NAV = [
  {
    href: normalizePublicPath('/updates'),
    label: 'Updates',
    tooltip: 'Changelogs, releases, and Grok / xAI / SpaceX news',
  },
  {
    href: normalizePublicPath('/news'),
    label: 'News',
    tooltip: 'Cursor news articles, announcements, and blog posts',
  },
  {
    href: normalizePublicPath('/forum'),
    label: 'Forum',
    tooltip: 'Posts from the Cursor forum',
  },
  {
    href: normalizePublicPath('/issues'),
    label: 'Issues',
    tooltip: 'Bug reports and broken-install threads',
  },
  {
    href: normalizePublicPath('/community'),
    label: 'Community',
    tooltip: 'Reddit, Hacker News, and other community posts',
  },
  {
    href: normalizePublicPath('/discussion'),
    label: 'Discussion',
    tooltip: 'Opinion, roundups, and discussion threads',
  },
  {
    href: normalizePublicPath('/social'),
    label: 'Social',
    tooltip: 'Posts from Cursor, xAI, Grok, and SpaceX on X',
  },
  {
    href: normalizePublicPath('/videos'),
    label: 'Videos',
    tooltip: 'Official and community YouTube videos',
  },
  {
    href: normalizePublicPath('/tutorials'),
    label: 'Tutorials',
    tooltip: 'How-to guides and step-by-step tutorials',
  },
];

export const SITE_CHROME_NAV = [
  {
    href: normalizePublicPath('/games'),
    label: 'Games',
    tooltip: 'Cursor-themed board games — puns, commits, and diffs',
  },
  {
    href: normalizePublicPath('/newsletter'),
    label: 'Newsletter',
    tooltip: 'Subscribe to or manage your email newsletter',
  },
  {
    href: normalizePublicPath('/about'),
    label: 'About',
    tooltip: 'About this unofficial fan project',
  },
  {
    href: normalizePublicPath('/sources'),
    label: 'Sources',
    tooltip: 'RSS feeds and sources that power the site',
  },
];

export const HEADER_NAV = [...FEED_SECTION_NAV, ...SITE_CHROME_NAV];

export const FOOTER_NAV = [
  ...FEED_SECTION_NAV,
  {
    href: normalizePublicPath('/newsletter/unsubscribe'),
    label: 'Unsubscribe',
    tooltip: 'Unsubscribe from newsletter emails',
  },
  ...SITE_CHROME_NAV,
];

export const LEGAL_NAV = [
  {
    href: normalizePublicPath('/editorial-policy'),
    label: 'Editorial Policy',
    tooltip: 'How we source, attribute, and write original notes',
  },
  {
    href: normalizePublicPath('/privacy'),
    label: 'Privacy',
    tooltip: 'Privacy policy',
  },
  {
    href: normalizePublicPath('/terms'),
    label: 'Terms',
    tooltip: 'Terms of use',
  },
];
