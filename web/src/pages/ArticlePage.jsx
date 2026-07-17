import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sanitizeExternalUrl } from '../../../mobile/shared/url/safe-external-url.js';
import { PageMeta } from '../components/PageMeta.jsx';
import { DISCLAIMER } from '../config.js';
import { formatCategoryLabel } from '../utils/articleMedia.js';
import { AppShell } from '../layout/AppShell.jsx';
import { getPathForCategory } from '../routes/feedRoutes.js';
import { getArticlePageMeta } from '../seo/pageMeta.js';
import { fetchNewsItem } from '../services/newsApi.js';

function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function commentaryParagraphs(commentary) {
  return String(commentary || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function ArticlePage() {
  const { id: rawId } = useParams();
  const itemId = useMemo(() => {
    try {
      return decodeURIComponent(rawId || '');
    } catch {
      return rawId || '';
    }
  }, [rawId]);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, [itemId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setItem(null);

    fetchNewsItem(itemId)
      .then((data) => {
        if (cancelled) return;
        setItem(data.item || null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || 'Could not load this item');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const pageMeta = useMemo(() => getArticlePageMeta(item), [item]);
  const safeUrl = sanitizeExternalUrl(item?.canonicalUrl);
  const categoryPath = item?.category ? getPathForCategory(item.category) : '/';
  const paragraphs = commentaryParagraphs(item?.commentary);

  return (
    <AppShell>
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
        path={pageMeta.path}
        breadcrumbLabel={pageMeta.breadcrumbLabel}
      />
      <main className="app-main article-page">
        <p className="article-back">
          <Link to="/">← Back to feed</Link>
        </p>

        {loading ? <p className="status-msg">Loading…</p> : null}
        {!loading && error ? (
          <div className="status-msg error" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && item ? (
          <article className="article-detail">
            <header className="article-detail-header">
              <div className="article-detail-meta">
                <span className="badge">{formatCategoryLabel(item.category)}</span>
                {item.publishedAt ? (
                  <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                ) : null}
              </div>
              <h1>{item.title}</h1>
              <p className="article-byline">
                {item.attributionLabel || item.sourceName || 'Source'}
                {' · '}
                <Link to={categoryPath}>More {formatCategoryLabel(item.category)}</Link>
              </p>
            </header>

            {paragraphs.length > 0 ? (
              <div className="article-commentary">
                <h2 className="article-commentary-label">Why it matters</h2>
                {paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 64)}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="article-commentary article-commentary-fallback">
                <h2 className="article-commentary-label">Overview</h2>
                {item.excerpt ? (
                  <p>{item.excerpt}</p>
                ) : (
                  <p>
                    This item is listed from an external source. Open the original for the full story.
                  </p>
                )}
              </div>
            )}

            {item.excerpt && paragraphs.length > 0 ? (
              <aside className="article-excerpt-aside">
                <h2>Source teaser</h2>
                <p>{item.excerpt}</p>
              </aside>
            ) : null}

            <p className="article-disclaimer">{DISCLAIMER}</p>
            <p className="article-policy-note">
              We publish original notes and short excerpts only — never the full article.
              See our <Link to="/editorial-policy">editorial policy</Link>.
            </p>

            <footer className="article-detail-footer">
              {safeUrl ? (
                <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="article-original-cta"
                >
                  Read original →
                </a>
              ) : null}
            </footer>
          </article>
        ) : null}

        {!loading && !item && !error ? (
          <p className="status-msg">This item is no longer in the feed.</p>
        ) : null}
      </main>
    </AppShell>
  );
}
