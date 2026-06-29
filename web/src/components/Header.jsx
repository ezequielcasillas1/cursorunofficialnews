import { APP_NAME } from '../config.js';
import { SupporterSlot } from './SupporterSlot.jsx';

export function Header({ onRefresh, refreshing }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <p className="masthead-eyebrow">{today}</p>
        <h1>{APP_NAME}</h1>
        <hr className="masthead-rule" />
        <p className="masthead-sub">Your morning briefing on Cursor — changelog, releases, and community</p>
        <div className="masthead-actions">
          <button type="button" className="btn" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : import.meta.env.PROD ? 'Reload feed' : 'Refresh feed'}
          </button>
          <SupporterSlot variant="inline" />
        </div>
      </div>
    </header>
  );
}

export function DisclaimerBanner() {
  return null;
}
