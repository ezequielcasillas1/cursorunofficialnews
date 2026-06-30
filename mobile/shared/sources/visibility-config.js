/** Shared storage key suffix — mobile prepends @ in AsyncStorage wrapper. */
export const SOURCES_HIDDEN_STORAGE_KEY = 'cursor_news_sources_hidden';

/** Buy Me a Coffee page slug — override per platform via env. */
export const BMC_USERNAME_DEFAULT = 'casiezeq';

export function getBmcPageUrl(username) {
  const slug = String(username || '').trim();
  if (!slug) return '';
  return `https://www.buymeacoffee.com/${encodeURIComponent(slug)}`;
}
