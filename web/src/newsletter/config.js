import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_CATEGORIES,
} from '../../../mobile/src/config/notifications.js';

export const NEWSLETTER_CATEGORIES = NOTIFICATION_CATEGORIES;
export const DEFAULT_NEWSLETTER_PREFS = {
  ...DEFAULT_NOTIFICATION_PREFS,
  email: '',
  manageToken: '',
};

export const NEWSLETTER_PREFS_KEY = 'cursor_news_web_email_prefs';

export function normalizeNewsletterPrefs(prefs) {
  return {
    ...DEFAULT_NEWSLETTER_PREFS,
    ...prefs,
    categories: Array.isArray(prefs?.categories)
      ? prefs.categories
      : DEFAULT_NEWSLETTER_PREFS.categories,
    manageToken:
      typeof prefs?.manageToken === 'string'
        ? prefs.manageToken
        : DEFAULT_NEWSLETTER_PREFS.manageToken,
    email:
      typeof prefs?.email === 'string'
        ? prefs.email.trim().toLowerCase()
        : DEFAULT_NEWSLETTER_PREFS.email,
  };
}
