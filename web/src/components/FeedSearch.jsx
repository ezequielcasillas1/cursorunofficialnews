export function FeedSearch({ value, onChange, resultCount, totalCount }) {
  const trimmed = value.trim();
  const showCount = trimmed.length > 0 && typeof resultCount === 'number';

  return (
    <div className="feed-search">
      <label className="feed-search-label" htmlFor="feed-search-input">
        Search
      </label>
      <div className="feed-search-row">
        <input
          id="feed-search-input"
          type="search"
          className="feed-search-input"
          placeholder="Search titles, sources, excerpts…"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={showCount ? 'feed-search-count' : undefined}
        />
        {trimmed ? (
          <button
            type="button"
            className="btn btn-ghost feed-search-clear"
            onClick={() => onChange('')}
          >
            Clear
          </button>
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
