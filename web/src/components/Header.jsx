import { APP_NAME, DISCLAIMER } from '../config.js';

export function Header({ onRefresh, refreshing }) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div>
          <h1>{APP_NAME}</h1>
          <p className="masthead-sub">Changelog · Releases · Community</p>
        </div>
        <button type="button" className="btn" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing…' : 'Refresh feed'}
        </button>
      </div>
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
