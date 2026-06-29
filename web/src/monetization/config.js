/** Google AdSense publisher client ID, e.g. ca-pub-xxxxxxxxxxxxxxxx */
export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim() || '';

/** Optional display ad slot ID — create a Display ad unit in AdSense, then paste the slot ID here. */
export const ADSENSE_SLOT_ID =
  import.meta.env.VITE_ADSENSE_SLOT_ID?.trim() ||
  import.meta.env.VITE_ADSENSE_SLOT?.trim() ||
  '';

/** Buy Me a Coffee username (page slug). Prod defaults to casiezeq; override via VITE_BMC_USERNAME. */
const BMC_USERNAME_ENV = import.meta.env.VITE_BMC_USERNAME?.trim() || '';
export const BMC_USERNAME = BMC_USERNAME_ENV || (import.meta.env.PROD ? 'casiezeq' : '');

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

/** Public BMC creator page (always exists once the account is live). */
export function getBmcPageUrl() {
  if (!BMC_USERNAME) return '';
  return `https://www.buymeacoffee.com/${encodeURIComponent(BMC_USERNAME)}`;
}

/**
 * Membership hub URL — only works after Memberships are enabled in the BMC dashboard.
 * Falls back to the main page so tier buttons never 404 before go-live setup.
 */
export function getBmcMembershipUrl() {
  if (!BMC_USERNAME) return '';
  return `${getBmcPageUrl()}/membership`;
}

/** Membership checkout URL for a monthly tier ($1–$5). Override per tier via env. */
export function getTacoTierUrl(amount) {
  const envKey = TIER_URL_KEYS[amount];
  const override = envKey ? import.meta.env[envKey]?.trim() : '';
  if (override) return override;

  // Main page shows the membership widget once tiers exist; /membership 404s until then.
  return getBmcPageUrl();
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
