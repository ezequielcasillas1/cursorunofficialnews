/** Google AdSense publisher client ID, e.g. ca-pub-xxxxxxxxxxxxxxxx */
export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim() || '';

/** Optional display ad slot ID — create a Display ad unit in AdSense, then paste the slot ID here. */
export const ADSENSE_SLOT_ID =
  import.meta.env.VITE_ADSENSE_SLOT_ID?.trim() ||
  import.meta.env.VITE_ADSENSE_SLOT?.trim() ||
  '';

/** Dev-only: treat all visitors as active members (no Stripe checkout needed). */
export const MEMBERSHIP_DEV_ACTIVE = import.meta.env.VITE_MEMBERSHIP_DEV_ACTIVE === 'true';

/** Dev-only email used to claim a real membership token for newsletter testing. */
export const MEMBERSHIP_DEV_EMAIL = import.meta.env.VITE_MEMBERSHIP_DEV_EMAIL?.trim() || '';

/** $1–$5/mo tiers — checkout sessions are created server-side, no client Stripe key needed. */
export const MEMBERSHIP_TIER_AMOUNTS = [1, 2, 3, 4, 5];

export function isMonetizationConfigured() {
  return true;
}

export function isAdSenseConfigured() {
  return Boolean(ADSENSE_CLIENT_ID);
}
