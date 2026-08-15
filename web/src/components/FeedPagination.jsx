import { Button } from '@/components/ui/button';
import { getPaginationRange } from '../feed/getPaginationRange.js';

export function FeedPagination({ page, totalPages, onPageChange, loading = false }) {
  if (totalPages <= 1) return null;

  const range = getPaginationRange(page, totalPages);

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-3" aria-label="Feed pages">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => onPageChange(page - 1)}
        disabled={loading || page <= 1}
        aria-label="Previous page"
      >
        Previous
      </Button>

      <ol className="m-0 flex list-none gap-1.5 p-0">
        {range.map((entry, index) =>
          entry === '…' ? (
            <li key={`ellipsis-${index}`} className="flex items-center px-1 text-muted-foreground" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <Button
                type="button"
                variant={entry === page ? 'default' : 'outline'}
                size="icon"
                className="rounded-full"
                onClick={() => onPageChange(entry)}
                disabled={loading || entry === page}
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? 'page' : undefined}
              >
                {entry}
              </Button>
            </li>
          ),
        )}
      </ol>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => onPageChange(page + 1)}
        disabled={loading || page >= totalPages}
        aria-label="Next page"
      >
        Next
      </Button>
    </nav>
  );
}
