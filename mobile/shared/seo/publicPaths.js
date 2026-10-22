/** Shared URL shape for sitemap, canonical tags, and internal links (trailing slash except home). */

export const SITE_ORIGIN = 'https://cursorunofficial.news';

export function normalizePublicPath(path) {
  if (!path || path === '/') return '/';
  let p = path.startsWith('/') ? path : `/${path}`;
  if (/\.[a-z0-9]+$/i.test(p)) return p;
  return p.endsWith('/') ? p : `${p}/`;
}

export function buildCanonicalUrl(path) {
  const normalized = normalizePublicPath(path);
  return normalized === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${normalized}`;
}

/** One encoding pass — matches React Router `useParams` + ArticlePage decode. */
export function encodeItemIdForPath(id) {
  return encodeURIComponent(String(id));
}

export function itemPublicPath(id) {
  return normalizePublicPath(`/item/${encodeItemIdForPath(id)}`);
}
