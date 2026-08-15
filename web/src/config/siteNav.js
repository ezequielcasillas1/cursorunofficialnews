/** Site header/footer nav links and tooltip copy — shared across masthead and footer. */

export const FEED_SECTION_NAV = [
  {
    href: '/updates',
    label: 'Updates',
    tooltip: 'Changelogs, releases, and Grok / xAI / SpaceX news',
  },
  {
    href: '/news',
    label: 'News',
    tooltip: 'Cursor news articles, announcements, and blog posts',
  },
  {
    href: '/forum',
    label: 'Forum',
    tooltip: 'Posts from the Cursor forum',
  },
  {
    href: '/issues',
    label: 'Issues',
    tooltip: 'Bug reports and broken-install threads',
  },
  {
    href: '/community',
    label: 'Community',
    tooltip: 'Reddit, Hacker News, and other community posts',
  },
  {
    href: '/discussion',
    label: 'Discussion',
    tooltip: 'Opinion, roundups, and discussion threads',
  },
  {
    href: '/social',
    label: 'Social',
    tooltip: 'Posts from Cursor, xAI, Grok, and SpaceX on X',
  },
  {
    href: '/videos',
    label: 'Videos',
    tooltip: 'Official and community YouTube videos',
  },
  {
    href: '/tutorials',
    label: 'Tutorials',
    tooltip: 'How-to guides and step-by-step tutorials',
  },
];

export const SITE_CHROME_NAV = [
  {
    href: '/games',
    label: 'Games',
    tooltip: 'Cursor-themed board games — puns, commits, and diffs',
  },
  {
    href: '/newsletter',
    label: 'Newsletter',
    tooltip: 'Subscribe to or manage your email newsletter',
  },
  {
    href: '/about',
    label: 'About',
    tooltip: 'About this unofficial fan project',
  },
  {
    href: '/sources',
    label: 'Sources',
    tooltip: 'RSS feeds and sources that power the site',
  },
];

export const HEADER_NAV = [...FEED_SECTION_NAV, ...SITE_CHROME_NAV];

export const FOOTER_NAV = [
  ...FEED_SECTION_NAV,
  {
    href: '/newsletter/unsubscribe',
    label: 'Unsubscribe',
    tooltip: 'Unsubscribe from newsletter emails',
  },
  {
    href: '/membership/unsubscribe',
    label: 'Cancel membership',
    tooltip: 'Cancel your paid supporter membership',
  },
  ...SITE_CHROME_NAV,
];

export const LEGAL_NAV = [
  {
    href: '/editorial-policy',
    label: 'Editorial Policy',
    tooltip: 'How we source, attribute, and write original notes',
  },
  {
    href: '/privacy',
    label: 'Privacy',
    tooltip: 'Privacy policy',
  },
  {
    href: '/terms',
    label: 'Terms',
    tooltip: 'Terms of use',
  },
];
