import {
  NEWSLETTER_PREFS_KEY,
  DEFAULT_NEWSLETTER_PREFS,
  normalizeNewsletterPrefs,
} from './config.js';

function consumeUrlToken(paramName) {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(paramName)?.trim();
    if (!token) return '';

    params.delete(paramName);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
    return token;
  } catch {
    return '';
  }
}

/** Read ?newsletter_verify_token= from URL for one-time subscription confirmation. */
export function consumeNewsletterVerifyTokenFromUrl() {
  return consumeUrlToken('newsletter_verify_token');
}

export function loadNewsletterPrefs() {
  try {
    const raw = localStorage.getItem(NEWSLETTER_PREFS_KEY);
    if (!raw) return { ...DEFAULT_NEWSLETTER_PREFS };
    return normalizeNewsletterPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_NEWSLETTER_PREFS };
  }
}

export function saveNewsletterPrefs(prefs) {
  try {
    localStorage.setItem(
      NEWSLETTER_PREFS_KEY,
      JSON.stringify(normalizeNewsletterPrefs(prefs)),
    );
  } catch {
    /* localStorage unavailable */
  }
}
