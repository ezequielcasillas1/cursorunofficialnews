import { useEffect, useRef } from 'react';

export function CookieConsent({ onAccept }) {
  const acceptRef = useRef(null);

  useEffect(() => {
    acceptRef.current?.focus();
  }, []);

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
      aria-modal="true"
    >
      <div className="cookie-consent-inner">
        <p id="cookie-consent-title" className="cookie-consent-title">
          We use cookies
        </p>
        <p id="cookie-consent-desc" className="cookie-consent-text">
          This site uses cookies for basic functionality and to help reduce automated abuse.
          Accept to continue browsing.
        </p>
        <div className="cookie-consent-actions">
          <button
            ref={acceptRef}
            type="button"
            className="btn cookie-consent-accept"
            onClick={onAccept}
            aria-label="Accept cookies and continue"
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
