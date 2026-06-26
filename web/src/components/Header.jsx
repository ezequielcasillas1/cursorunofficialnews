import { APP_NAME, DISCLAIMER } from '../config.js';

export function Header({ onRefresh, refreshing }) {
  return (
    <header className="app-header">
      <div>
        <h1>{APP_NAME}</h1>
        <p className="tagline">Changelog, releases, and updates — link to originals</p>
      </div>
      <button type="button" className="btn" onClick={onRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing…' : 'Refresh feed'}
      </button>
    </header>
  );
}

export function DisclaimerBanner() {
  return (
    <aside className="disclaimer" role="note">
      {DISCLAIMER}
    </aside>
  );
}
