import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_KEY,
  CONSENT_ACCEPTED,
} from './config.js';

/** @returns {boolean} */
export function hasCookieConsent() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === CONSENT_ACCEPTED;
  } catch {
    return false;
  }
}

function setConsentCookie() {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${COOKIE_CONSENT_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* non-fatal */
  }
}

export function applyConsentFlag(accepted) {
  try {
    if (accepted) {
      document.documentElement.dataset.cookieConsent = CONSENT_ACCEPTED;
    } else {
      delete document.documentElement.dataset.cookieConsent;
    }
  } catch {
    /* non-fatal */
  }
}

export function acceptCookieConsent() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, CONSENT_ACCEPTED);
  } catch {
    /* localStorage unavailable */
  }
  setConsentCookie();
  applyConsentFlag(true);
}
