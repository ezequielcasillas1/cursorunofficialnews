import { APP_NAME } from '../config.js';
import { HEADER_NAV } from '../config/siteNav.js';
import { useSiteViews } from '../hooks/useSiteViews.js';
import { SupporterSlot } from './SupporterSlot.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { Tooltip } from './Tooltip.jsx';

const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com/casiezeq' },
  { label: 'Reddit', href: 'https://reddit.com/user/Ok-Address3409' },
];

export function Header({ onRefresh, refreshing }) {
  const onlineCount = useSiteViews();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="site-header">
      <div className="site-topbar">
        <div className="site-topbar-inner">
          <a href="/" className="site-topbar-brand">
            <img
              className="site-topbar-logo site-topbar-logo-default"
              src="/brand/logo-icon.svg"
              alt=""
              width={28}
              height={28}
              decoding="async"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
            <img
              className="site-topbar-logo site-topbar-logo-light"
              src="/brand/logo-icon-light.svg"
              alt=""
              width={28}
              height={28}
              decoding="async"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
            <span>{APP_NAME}</span>
          </a>

          <nav className="site-topbar-nav" aria-label="Site sections">
            {HEADER_NAV.map((link) => (
              <Tooltip key={link.href} text={link.tooltip}>
                <a href={link.href}>{link.label}</a>
              </Tooltip>
            ))}
          </nav>

          <div className="site-topbar-actions">
            <ThemeToggle />
            {onRefresh ? (
              <button type="button" className="btn btn-ghost" onClick={onRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </button>
            ) : null}
            <SupporterSlot variant="inline" />
          </div>
        </div>
      </div>

      <div className="site-hero">
        <div className="site-hero-inner">
          <p className="site-hero-meta">
            <span>{today}</span>
            {onlineCount !== null ? (
              <span aria-live="polite">
                {onlineCount.toLocaleString()} {onlineCount === 1 ? 'person' : 'people'} online
              </span>
            ) : null}
            <span className="site-hero-social">
              {SOCIAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </span>
          </p>
          <h1 className="site-hero-title">{APP_NAME}</h1>
          <p className="site-hero-lede">
            Independent Cursor briefing — changelogs, releases, and community, with original notes on every story.
          </p>
          <div className="site-hero-cta">
            <a className="btn btn-primary" href="#feed">
              Browse the feed
            </a>
            <a className="btn btn-ghost" href="/editorial-policy">
              Editorial policy
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

export function DisclaimerBanner() {
  return null;
}
