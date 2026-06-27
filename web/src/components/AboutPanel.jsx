import { useEffect, useState } from 'react';
import { fetchSources } from '../services/newsApi.js';

export function StatusBar({ lastIngestAt, sourceCount }) {
  if (!lastIngestAt) return null;
  return (
    <p className="status-bar">
      Last ingest: {new Date(lastIngestAt).toLocaleString()} · {sourceCount} active sources
    </p>
  );
}

export function AboutPanel() {
  const [sources, setSources] = useState([]);
  const [sourcesError, setSourcesError] = useState('');

  useEffect(() => {
    fetchSources()
      .then((data) => setSources(data.sources || []))
      .catch((err) => setSourcesError(err.message || 'Could not load sources'));
  }, []);

  return (
    <section className="about-panel">
      <h2>About</h2>
      <ul>
        <li>Free core feed — headlines and excerpts only</li>
        <li>Every item opens the original source in a new tab</li>
        <li>Unofficial fan project — not affiliated with Anysphere</li>
      </ul>

      <h2>Sources</h2>
      {sourcesError ? <p className="hint">{sourcesError}</p> : null}
      {sources.length ? (
        <ul className="sources-list">
          {sources.map((source) => (
            <li key={source.id}>
              <span className="source-name">{source.name}</span>
              {source.isOfficial ? ' · Official' : ''}
              {source.attributionLabel ? ` · ${source.attributionLabel}` : ''}
            </li>
          ))}
        </ul>
      ) : sourcesError ? null : (
        <p className="hint">Loading sources…</p>
      )}
    </section>
  );
}
