import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_KEY,
  CONSENT_ACCEPTED,
} from './config.js';

function hasConsentLocalStorage() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === CONSENT_ACCEPTED;
  } catch {
    return false;
  }
}

/** @returns {boolean} */
export function hasConsentCookie() {
  try {
    if (typeof document === 'undefined') return false;
    return document.cookie.split(';').some((part) => part.trim() === `${COOKIE_CONSENT_COOKIE}=1`);
  } catch {
    return false;
  }
}

/** Requires both localStorage flag and consent cookie to reduce single-store bypass. */
export function hasCookieConsent() {
  return hasConsentLocalStorage() && hasConsentCookie();
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
      document.documentElement.dataset.consent = 'accepted';
    } else {
      delete document.documentElement.dataset.cookieConsent;
      document.documentElement.dataset.consent = 'pending';
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
