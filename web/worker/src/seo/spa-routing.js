import { normalizePublicPath } from '../../../../mobile/shared/seo/publicPaths.js';

const STATIC_PAGE_PATHS = [
  '/newsletter/',
  '/newsletter/unsubscribe/',
  '/games/',
  '/about/',
  '/editorial-policy/',
  '/sources/',
  '/privacy/',
  '/terms/',
  '/404/',
];

const FEED_SECTION_PATHS = [
  '/updates/',
  '/news/',
  '/forum/',
  '/issues/',
  '/community/',
  '/discussion/',
  '/social/',
  '/videos/',
  '/tutorials/',
].map((path) => normalizePublicPath(path));

const KNOWN_SPA_PATHS = new Set(['/', ...FEED_SECTION_PATHS, ...STATIC_PAGE_PATHS]);

export function normalizeSpaPathname(pathname) {
  return normalizePublicPath(pathname || '/');
}

export function isKnownSpaPath(pathname) {
  const normalized = normalizeSpaPathname(pathname);
  if (KNOWN_SPA_PATHS.has(normalized)) return true;
  if (/^\/games\/[^/]+\/?$/.test(normalized)) return true;
  if (/^\/item\/[^/]+\/$/.test(normalized)) return true;
  return false;
}

export function parseItemIdFromPath(pathname) {
  const normalized = normalizeSpaPathname(pathname);
  const match = normalized.match(/^\/item\/([^/]+)\/$/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}
