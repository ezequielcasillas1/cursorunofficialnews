import { APP_NAME } from '../config.js';
import { useSiteViews } from '../hooks/useSiteViews.js';
import { SupporterSlot } from './SupporterSlot.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';

const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/casiezeq' },
  { label: 'Reddit', href: 'https://reddit.com/user/Ok-Address3409' },
];

export function Header({ onRefresh, refreshing }) {
  const viewCount = useSiteViews();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="masthead-utility">
          <div className="masthead-utility-start">
            <p className="masthead-eyebrow">{today}</p>
            {viewCount !== null ? (
              <p className="masthead-view-count" aria-live="polite">
                <span className="masthead-view-count-value">{viewCount.toLocaleString()}</span>
                {' '}
                site {viewCount === 1 ? 'view' : 'views'}
              </p>
            ) : null}
          </div>
          <nav className="masthead-social" aria-label="Follow on social media">
            <span className="masthead-social-label">Follow</span>
            {SOCIAL_LINKS.map((link, index) => (
              <span key={link.label} className="masthead-social-item">
                {index > 0 ? <span className="masthead-social-sep" aria-hidden="true">·</span> : null}
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
        </div>
        <div className="masthead-brand">
          <img
            className="masthead-logo masthead-logo-default"
            src="/brand/logo-icon.svg"
            alt=""
            width={52}
            height={52}
            decoding="async"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
          <img
            className="masthead-logo masthead-logo-light"
            src="/brand/logo-icon-light.svg"
            alt=""
            width={52}
            height={52}
            decoding="async"
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
          <div className="masthead-brand-text">
            <h1>{APP_NAME}</h1>
            <div className="masthead-rule-group" aria-hidden="true">
              <span className="masthead-rule masthead-rule-thick" />
              <span className="masthead-rule masthead-rule-thin" />
            </div>
            <p className="masthead-sub">
              Your morning briefing on Cursor — changelog, releases, and community
            </p>
          </div>
        </div>
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
