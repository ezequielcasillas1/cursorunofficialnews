import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FeedSearch({ value, onChange, resultCount, totalCount }) {
  const trimmed = value.trim();
  const showCount = trimmed.length > 0 && typeof resultCount === 'number';

  return (
    <div className="feed-search">
      <Label
        htmlFor="feed-search-input"
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground"
      >
        Search
      </Label>
      <div className="flex items-center gap-2">
        <Input
          id="feed-search-input"
          type="search"
          className="h-12 rounded-full px-4"
          placeholder="Search titles, sources, excerpts…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={showCount ? 'feed-search-count' : undefined}
        />
        {trimmed ? (
          <Button type="button" variant="outline" size="pill" className="h-12 shrink-0" onClick={() => onChange('')}>
            Clear
          </Button>
        ) : null}
      </div>
      {showCount ? (
        <p id="feed-search-count" className="feed-search-count" aria-live="polite">
          {resultCount === 0
            ? 'No matches'
            : `${resultCount} of ${totalCount} ${resultCount === 1 ? 'item' : 'items'}`}
        </p>
      ) : null}
    </div>
  );
}
