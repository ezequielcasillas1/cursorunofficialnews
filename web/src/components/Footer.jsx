import { APP_NAME, DISCLAIMER } from '../config.js';

const FOOTER_NAV = [
  { href: '/updates', label: 'Updates' },
  { href: '/news', label: 'News' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/newsletter', label: 'Newsletter' },
  { href: '/about', label: 'About' },
  { href: '/sources', label: 'Sources' },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-brand">{APP_NAME}</p>
        <nav className="site-footer-nav" aria-label="Browse site sections">
          {FOOTER_NAV.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
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
