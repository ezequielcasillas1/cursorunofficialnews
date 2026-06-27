import { NewsCard } from './NewsCard.jsx';

export function NewsFeed({ items, loading, error, sourceMap }) {
  if (loading) {
    return <p className="status-msg">Loading news…</p>;
  }

  if (error) {
    return (
      <div className="status-msg error" role="alert">
        <p>{error}</p>
        <p className="hint">
          Start the API: <code>npm run dev:api</code> from repo root, or{' '}
          <code>cd mobile/server &amp;&amp; npm run dev</code>
        </p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="status-msg">
        No items yet. Click <strong>Refresh feed</strong> to run ingest.
      </p>
    );
  }

  return (
    <ul className="news-list">
      {items.map((item) => (
        <li key={item.id}>
          <NewsCard
            item={item}
            isOfficial={Boolean(sourceMap?.[item.sourceId]?.isOfficial)}
          />
        </li>
      ))}
    </ul>
  );
}
