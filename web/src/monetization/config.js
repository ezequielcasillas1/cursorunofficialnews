/** Google AdSense publisher client ID, e.g. ca-pub-xxxxxxxxxxxxxxxx */
export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim() || '';

/** Optional display ad slot ID */
export const ADSENSE_SLOT_ID = import.meta.env.VITE_ADSENSE_SLOT_ID?.trim() || '';

/** Buy Me a Coffee username (page slug), e.g. cursorunofficialnews */
export const BMC_USERNAME = import.meta.env.VITE_BMC_USERNAME?.trim() || '';

/** Dev-only: treat all visitors as ad-free supporters */
export const BMC_DEV_ADFREE = import.meta.env.VITE_BMC_DEV_ADFREE === 'true';

export const TACO_TIER_AMOUNTS = [1, 2, 3, 4, 5];

const TIER_URL_KEYS = {
  1: 'VITE_BMC_TIER_URL_1',
  2: 'VITE_BMC_TIER_URL_2',
  3: 'VITE_BMC_TIER_URL_3',
  4: 'VITE_BMC_TIER_URL_4',
  5: 'VITE_BMC_TIER_URL_5',
};

/** Membership checkout URL for a monthly tier ($1–$5). Override per tier via env. */
export function getTacoTierUrl(amount) {
  const envKey = TIER_URL_KEYS[amount];
  const override = envKey ? import.meta.env[envKey]?.trim() : '';
  if (override) return override;

  if (!BMC_USERNAME) return '';

  return `https://www.buymeacoffee.com/${encodeURIComponent(BMC_USERNAME)}/membership`;
}

export function isMonetizationConfigured() {
  return Boolean(ADSENSE_CLIENT_ID || BMC_USERNAME || BMC_DEV_ADFREE);
}

export function isAdSenseConfigured() {
  return Boolean(ADSENSE_CLIENT_ID);
}

export function isBmcConfigured() {
  return Boolean(BMC_USERNAME);
}
