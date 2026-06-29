import { APP_NAME } from '../config.js';
import { SupporterSlot } from './SupporterSlot.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/casiezeq' },
  { label: 'Reddit', href: 'https://reddit.com/user/Ok-Address3409' },
];

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
        <nav className="masthead-social" aria-label="Follow on social media">
          {SOCIAL_LINKS.map((link, index) => (
            <span key={link.label} className="masthead-social-item">
              {index > 0 ? <span className="masthead-social-sep" aria-hidden="true">·</span> : null}
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </span>
          ))}
        </nav>
        <p className="masthead-eyebrow">{today}</p>
        <h1>{APP_NAME}</h1>
        <hr className="masthead-rule" />
        <p className="masthead-sub">Your morning briefing on Cursor — changelog, releases, and community</p>
        <div className="masthead-actions">
          <ThemeToggle />
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
