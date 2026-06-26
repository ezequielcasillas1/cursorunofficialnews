import { NewsCard } from './NewsCard.jsx';

export function NewsFeed({ items, loading, error }) {
  if (loading) {
    return <p className="status-msg">Loading news…</p>;
  }

  if (error) {
    return (
      <div className="status-msg error" role="alert">
        <p>{error}</p>
        <p className="hint">Start the API: <code>cd unofficial-cursor-news/api && npm run dev</code></p>
      </div>
    );
  }

  if (!items.length) {
    return <p className="status-msg">No items yet. Try Refresh feed.</p>;
  }

  return (
    <ul className="news-list">
      {items.map((item) => (
        <li key={item.id}>
          <NewsCard item={item} />
        </li>
      ))}
    </ul>
  );
}
