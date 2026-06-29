import { getPaginationRange } from '../feed/getPaginationRange.js';

export function FeedPagination({ page, totalPages, onPageChange, loading = false }) {
  if (totalPages <= 1) return null;

  const range = getPaginationRange(page, totalPages);

  return (
    <nav className="feed-pagination" aria-label="Feed pages">
      <button
        type="button"
        className="btn btn-ghost feed-pagination-btn"
        onClick={() => onPageChange(page - 1)}
        disabled={loading || page <= 1}
        aria-label="Previous page"
      >
        Previous
      </button>

      <ol className="feed-pagination-pages">
        {range.map((entry, index) =>
          entry === '…' ? (
            <li key={`ellipsis-${index}`} className="feed-pagination-ellipsis" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                className={`feed-pagination-page${entry === page ? ' feed-pagination-page-active' : ''}`}
                onClick={() => onPageChange(entry)}
                disabled={loading || entry === page}
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? 'page' : undefined}
              >
                {entry}
              </button>
            </li>
          ),
        )}
      </ol>

      <button
        type="button"
        className="btn btn-ghost feed-pagination-btn"
        onClick={() => onPageChange(page + 1)}
        disabled={loading || page >= totalPages}
        aria-label="Next page"
      >
        Next
      </button>
    </nav>
  );
}
