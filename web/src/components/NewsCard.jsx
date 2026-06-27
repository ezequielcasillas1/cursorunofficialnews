function formatDate(iso) {
  if (!iso) return 'Unknown date';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCategoryLabel(category) {
  const labels = {
    changelog: 'Changelog',
    release: 'Release',
    blog: 'Blog',
    forum: 'Forum',
    video: 'Video',
    tutorial: 'Tutorial',
  };
  return labels[category] || category || 'News';
}

export function NewsCard({ item, isOfficial = false }) {
  return (
    <article className="news-card">
      <div className="news-card-meta">
        <span className="badge">{formatCategoryLabel(item.category)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isOfficial ? <span className="badge-official">Official</span> : null}
          <time dateTime={item.publishedAt || undefined}>{formatDate(item.publishedAt)}</time>
        </div>
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
