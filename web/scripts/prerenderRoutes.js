import { getFeedPageMeta, getStaticPageMeta, buildCanonicalUrl } from '../src/seo/pageMeta.js';
import { FEED_SECTION_ROUTES, STATIC_PAGE_ROUTES } from '../src/routes/feedRoutes.js';

/** Routes that receive static HTML shells at build time (crawler-visible meta). */
export function getPrerenderRoutes() {
  const feedRoutes = [{ categoryId: 'all' }, ...FEED_SECTION_ROUTES].map(({ categoryId }) =>
    getFeedPageMeta(categoryId),
  );
  const staticRoutes = STATIC_PAGE_ROUTES.map(({ id }) => getStaticPageMeta(id));

  return [...feedRoutes, ...staticRoutes].map((meta) => ({
    ...meta,
    canonical: buildCanonicalUrl(meta.path),
  }));
}
