import {
  NEWSLETTER_PREFS_KEY,
  DEFAULT_NEWSLETTER_PREFS,
  normalizeNewsletterPrefs,
} from './config.js';

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
