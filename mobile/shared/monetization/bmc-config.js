/** Buy Me a Coffee page slug — override per platform via env. */
export const BMC_USERNAME_DEFAULT = 'casiezeq';

export function getBmcPageUrl(username) {
  const slug = String(username || '').trim();
  if (!slug) return '';
  return `https://www.buymeacoffee.com/${encodeURIComponent(slug)}`;
}
