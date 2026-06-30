import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_CATEGORIES,
} from '../../../mobile/src/config/notifications.js';
import {
  DEFAULT_CATEGORY_ITEM_LIMIT,
  MAX_CATEGORY_ITEM_LIMIT,
  MIN_CATEGORY_ITEM_LIMIT,
  normalizeCategoryLimits,
} from '../../../mobile/shared/notifications/category-limits.js';

export const NEWSLETTER_CATEGORIES = NOTIFICATION_CATEGORIES;
export const NEWSLETTER_CATEGORY_LIMIT = {
  min: MIN_CATEGORY_ITEM_LIMIT,
  max: MAX_CATEGORY_ITEM_LIMIT,
  default: DEFAULT_CATEGORY_ITEM_LIMIT,
};
export const DEFAULT_NEWSLETTER_PREFS = {
  ...DEFAULT_NOTIFICATION_PREFS,
  email: '',
  manageToken: '',
  pendingVerification: false,
  categoryLimits: {},
};

export const NEWSLETTER_PREFS_KEY = 'cursor_news_web_email_prefs';

/** Newsletter settings panel starts collapsed on initial page load. */
export const NEWSLETTER_PANEL_DEFAULT_EXPANDED = false;

export function normalizeNewsletterPrefs(prefs) {
  const categories = Array.isArray(prefs?.categories)
    ? prefs.categories
    : DEFAULT_NEWSLETTER_PREFS.categories;

  return {
    ...DEFAULT_NEWSLETTER_PREFS,
    ...prefs,
    categories,
    categoryLimits: normalizeCategoryLimits(prefs?.categoryLimits, categories),
    manageToken:
      typeof prefs?.manageToken === 'string'
        ? prefs.manageToken
        : DEFAULT_NEWSLETTER_PREFS.manageToken,
    pendingVerification: Boolean(prefs?.pendingVerification),
    email:
      typeof prefs?.email === 'string'
        ? prefs.email.trim().toLowerCase()
        : DEFAULT_NEWSLETTER_PREFS.email,
  };
}
