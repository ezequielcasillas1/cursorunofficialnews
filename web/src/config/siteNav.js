/** Site header/footer nav links and tooltip copy — shared across masthead and footer. */

export const HEADER_NAV = [
  {
    href: '/updates',
    label: 'Updates',
    tooltip: 'Product and release updates — changelogs and version notes',
  },
  {
    href: '/news',
    label: 'News',
    tooltip: 'Cursor news articles, announcements, and blog posts',
  },
  {
    href: '/tutorials',
    label: 'Tutorials',
    tooltip: 'How-to guides and step-by-step tutorials',
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

export const FOOTER_NAV = [
  ...HEADER_NAV.slice(0, 4),
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
  ...HEADER_NAV.slice(4),
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
