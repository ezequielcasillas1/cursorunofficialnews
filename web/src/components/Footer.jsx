import { APP_NAME, DISCLAIMER } from '../config.js';
import { FOOTER_NAV, LEGAL_NAV } from '../config/siteNav.js';
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
        <nav className="site-footer-nav site-footer-legal" aria-label="Legal">
          {LEGAL_NAV.map((link) => (
            <Tooltip key={link.href} text={link.tooltip}>
              <a href={link.href}>{link.label}</a>
            </Tooltip>
          ))}
        </nav>
        <p className="site-footer-disclaimer">{DISCLAIMER}</p>
        <p className="site-footer-meta">
          Unofficial fan project · {year} · Not affiliated with Anysphere
        </p>
      </div>
    </footer>
  );
}
