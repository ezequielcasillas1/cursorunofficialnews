export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/casiezeq';

export function getNewsletterWebUrl(webBaseUrl) {
  const base = String(webBaseUrl || '').replace(/\/$/, '');
  return `${base}/newsletter/`;
}
