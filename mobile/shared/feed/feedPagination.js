/** Default items per feed page (API + clients). */
export const FEED_PAGE_SIZE = 30;

/** Hard cap for a single GET /v1/news request. */
export const FEED_PAGE_MAX = 200;

/**
 * Parse page/limit/offset query params for GET /v1/news.
 * `page` defaults to 1; `offset` overrides page when explicitly set.
 */
export function parseFeedPaginationQuery(query = {}) {
  const parsedLimit = query.limit ? Number(query.limit) : FEED_PAGE_SIZE;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), FEED_PAGE_MAX)
      : FEED_PAGE_SIZE;

  const parsedPage = query.page ? Number(query.page) : 1;
  const page =
    Number.isFinite(parsedPage) && parsedPage >= 1 ? Math.floor(parsedPage) : 1;

  const parsedOffset =
    query.offset !== undefined ? Number(query.offset) : undefined;
  const offset =
    parsedOffset !== undefined &&
    Number.isFinite(parsedOffset) &&
    parsedOffset >= 0
      ? Math.floor(parsedOffset)
      : (page - 1) * limit;

  return { limit, page, offset };
}

/** Response metadata for paginated feed lists. */
export function buildFeedPaginationMeta({ total, limit, page, offset, itemCount }) {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
  const hasMore = offset + itemCount < total;
  return { total, page, pageSize: limit, totalPages, hasMore };
}
