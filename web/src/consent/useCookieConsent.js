import { useCallback, useEffect, useState } from 'react';
import { acceptCookieConsent, applyConsentFlag, hasCookieConsent } from './storage.js';

export function useCookieConsent() {
  const [hasConsent, setHasConsent] = useState(() => hasCookieConsent());

  useEffect(() => {
    applyConsentFlag(hasConsent);
  }, [hasConsent]);

  const acceptConsent = useCallback(() => {
    acceptCookieConsent();
    setHasConsent(true);
  }, []);

  return { hasConsent, acceptConsent };
}
