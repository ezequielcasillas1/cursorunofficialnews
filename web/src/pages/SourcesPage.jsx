import { useEffect, useMemo, useState } from 'react';
import { PageMeta } from '../components/PageMeta.jsx';
import { AppShell } from '../layout/AppShell.jsx';
import { getStaticPageMeta } from '../seo/pageMeta.js';
import { fetchSources } from '../services/newsApi.js';

function groupSourcesByCategory(sources) {
  const groups = new Map();
  for (const source of sources) {
    const key = source.category || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(source);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function SourcesPage() {
  const pageMeta = getStaticPageMeta('sources');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }, []);

  useEffect(() => {
    fetchSources()
      .then((data) => {
        setSources(data.sources || []);
        setError('');
      })
      .catch((err) => {
        setSources([]);
        setError(err.message || 'Failed to load sources');
      })
      .finally(() => setLoading(false));
  }, []);

  const groupedSources = useMemo(() => groupSourcesByCategory(sources), [sources]);

  return (
    <AppShell>
      <PageMeta
        title={pageMeta.title}
        description={pageMeta.description}
        path={pageMeta.path}
        breadcrumbLabel={pageMeta.breadcrumbLabel}
      />
      <main className="app-main static-page">
        <section className="static-page-intro">
          <h1>Ingest sources</h1>
          <p>
            Unofficial Cursor News aggregates these feeds. Every headline links back to the original
            publisher — we do not republish full articles.
          </p>
        </section>

        {loading ? <p className="hint">Loading sources…</p> : null}
        {error ? (
          <div className="status-msg error" role="alert">
            <p>{error}</p>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="sources-list">
            {groupedSources.map(([category, categorySources]) => (
              <section key={category} className="sources-group">
                <h2>{category}</h2>
                <ul>
                  {categorySources.map((source) => (
                    <li key={source.id}>
                      <span className="sources-name">{source.name}</span>
                      {source.isOfficial ? (
                        <span className="sources-badge">Official</span>
                      ) : null}
                      {!source.enabled ? (
                        <span className="sources-badge sources-badge-muted">Disabled</span>
                      ) : null}
                      {source.attributionLabel ? (
                        <span className="sources-attribution"> · {source.attributionLabel}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
