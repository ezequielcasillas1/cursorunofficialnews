import { sanitizeExternalUrl } from '../../../mobile/shared/url/safe-external-url.js';
import { formatCategoryLabel } from '../utils/articleMedia.js';
import { ArticleMedia } from './media/ArticleMedia.jsx';

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

export function NewsCard({ item, isOfficial = false, featured = false }) {
  const cardClass = featured ? 'news-card news-card-featured' : 'news-card';
  const safeUrl = sanitizeExternalUrl(item?.canonicalUrl);

  return (
    <article className={cardClass}>
      {featured ? <p className="news-card-kicker">Top Story</p> : null}
      <ArticleMedia item={item} featured={featured} />
      <div className="news-card-meta">
        <span className="badge">{formatCategoryLabel(item.category)}</span>
        {isOfficial ? <span className="badge-official">Official</span> : null}
        <time dateTime={item.publishedAt || undefined}>{formatDate(item.publishedAt)}</time>
      </div>
      <h2>
        {safeUrl ? (
          <a href={safeUrl} target="_blank" rel="noopener noreferrer">
            {item.title}
          </a>
        ) : (
          item.title
        )}
      </h2>
      {item.excerpt ? <p className="excerpt">{item.excerpt}</p> : null}
      <footer className="news-card-footer">
        <span>{item.attributionLabel || item.sourceName}</span>
        {safeUrl ? (
          <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="open-link">
            Read original →
          </a>
        ) : null}
      </footer>
    </article>
  );
}

