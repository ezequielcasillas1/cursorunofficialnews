import { APP_NAME, DISCLAIMER } from '../config.js';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-brand">{APP_NAME}</p>
        <p className="site-footer-disclaimer">{DISCLAIMER}</p>
        <p className="site-footer-meta">
          Unofficial fan project · {year} · Not affiliated with Anysphere
        </p>
      </div>
    </footer>
  );
}
