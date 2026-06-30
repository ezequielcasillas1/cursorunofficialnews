import { useEffect, useState } from 'react';
import { TACO_SOURCES_HIDDEN_TEASER } from '../../../mobile/shared/taco-unlock/config.js';
import { fetchSources } from '../services/newsApi.js';
import { TacoUnlockDialog } from './sources/TacoUnlockDialog.jsx';

export function StatusBar({ lastIngestAt, sourceCount, sourcesHidden = false }) {
  if (!lastIngestAt) return null;
  return (
    <p className="status-bar">
      Last updated {new Date(lastIngestAt).toLocaleString()}
      {sourcesHidden ? ' · sources hidden 🌮' : ` · ${sourceCount} sources`}
    </p>
  );
}

export function AboutPanel({ sourcesHidden, onUnlock }) {
  const [sources, setSources] = useState([]);
  const [sourcesError, setSourcesError] = useState('');
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    fetchSources()
      .then((data) => setSources(data.sources || []))
      .catch((err) => setSourcesError(err.message || 'Could not load sources'));
  }, []);

  return (
    <section className="about-panel">
      <h2>About this feed</h2>
      <ul>
        <li>Free headlines and excerpts — every item links to the original source</li>
        <li>Aggregated from official changelogs, releases, and community sources</li>
        <li>Unofficial fan project — not affiliated with Anysphere</li>
      </ul>

      <h2>Sources</h2>
      {sourcesHidden ? (
        <>
          <p className="hint sources-hidden-teaser">{TACO_SOURCES_HIDDEN_TEASER}</p>
          <button type="button" className="chip chip-sources-hidden" onClick={() => setUnlockOpen(true)}>
            Unlock sources
          </button>
          <TacoUnlockDialog
            open={unlockOpen}
            onClose={() => setUnlockOpen(false)}
            onUnlock={onUnlock}
          />
        </>
      ) : (
        <>
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
        </>
      )}
    </section>
  );
}
