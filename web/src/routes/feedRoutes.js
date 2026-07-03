import { FEED_CATEGORIES } from '../config/feedCategories.js';

export const SITE_ORIGIN = 'https://cursorunofficial.news';

/** Map category id → URL path */
export const CATEGORY_PATHS = Object.fromEntries(
  FEED_CATEGORIES.map((cat) => [cat.id, cat.id === 'all' ? '/' : `/${cat.id}`]),
);

export function getPathForCategory(categoryId) {
  return CATEGORY_PATHS[categoryId] ?? '/';
}

export function getCategoryFromPathname(pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (normalized === '/') return 'all';
  const segment = normalized.slice(1).split('/')[0];
  const match = FEED_CATEGORIES.find((cat) => cat.id === segment);
  return match?.id ?? null;
}

export const FEED_SECTION_ROUTES = FEED_CATEGORIES.filter((cat) => cat.id !== 'all').map((cat) => ({
  categoryId: cat.id,
  path: CATEGORY_PATHS[cat.id],
  label: cat.label,
}));

export const STATIC_PAGE_ROUTES = [
  { path: '/newsletter', id: 'newsletter', label: 'Newsletter' },
  { path: '/newsletter/unsubscribe', id: 'newsletterUnsubscribe', label: 'Unsubscribe' },
  { path: '/membership/unsubscribe', id: 'membershipUnsubscribe', label: 'Cancel membership' },
  { path: '/about', id: 'about', label: 'About' },
  { path: '/sources', id: 'sources', label: 'Sources' },
  { path: '/privacy', id: 'privacy', label: 'Privacy' },
  { path: '/terms', id: 'terms', label: 'Terms' },
];
