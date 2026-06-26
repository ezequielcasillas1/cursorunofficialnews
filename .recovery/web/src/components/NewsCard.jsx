function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NewsCard({ item }) {
  return (
    <article className="news-card">
      <div className="news-card-meta">
        <span className="badge">{item.category}</span>
        <time dateTime={item.publishedAt || undefined}>{formatDate(item.publishedAt)}</time>
      </div>
      <h2>
        <a href={item.canonicalUrl} target="_blank" rel="noopener noreferrer">
          {item.title}
        </a>
      </h2>
      {item.excerpt ? <p className="excerpt">{item.excerpt}</p> : null}
      <footer className="news-card-footer">
        <span>{item.attributionLabel || item.sourceName}</span>
        <a href={item.canonicalUrl} target="_blank" rel="noopener noreferrer" className="open-link">
          Open original →
        </a>
      </footer>
    </article>
  );
}
