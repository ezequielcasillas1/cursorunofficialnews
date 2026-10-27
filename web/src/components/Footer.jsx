import { Separator } from '@/components/ui/separator';
import { APP_NAME, DISCLAIMER } from '../config.js';
import { FOOTER_NAV, LEGAL_NAV } from '../config/siteNav.js';
import { BlueskyIcon } from './BlueskyIcon.jsx';
import { OWNER_BLUESKY_LABEL, OWNER_BLUESKY_URL } from '../config/ownerSocial.js';
import { BUY_ME_A_COFFEE_URL } from './support/SupportPanel.jsx';
import { Tooltip } from './Tooltip.jsx';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-brand">{APP_NAME}</p>
        <nav className="site-footer-nav" aria-label="Browse site sections">
          {FOOTER_NAV.map((link) => (
            <Tooltip key={link.href} text={link.tooltip}>
              <a href={link.href}>{link.label}</a>
            </Tooltip>
          ))}
        </nav>
        <Separator />
        <nav className="site-footer-nav site-footer-legal" aria-label="Legal">
          {LEGAL_NAV.map((link) => (
            <Tooltip key={link.href} text={link.tooltip}>
              <a href={link.href}>{link.label}</a>
            </Tooltip>
          ))}
        </nav>
        <p className="site-footer-disclaimer">{DISCLAIMER}</p>
        <p className="site-footer-support">
          <a href={BUY_ME_A_COFFEE_URL} target="_blank" rel="noopener noreferrer">
            Buy me a coffee
          </a>
          {' '}
          — optional tip to help keep the feed free
        </p>
        <p className="site-footer-meta">
          <a
            href={OWNER_BLUESKY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            <BlueskyIcon size={12} className="shrink-0" />
            {OWNER_BLUESKY_LABEL}
          </a>
          {' · '}
          Unofficial fan project · {year} · Not affiliated with Anysphere
        </p>
      </div>
    </footer>
  );
}
