import { getMembershipWebUrl } from '../../shared/monetization/membership-config.js';

const WEB_BASE_URL =
  process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim() || 'https://cursorunofficial.news';

/** Website membership panel — mobile has no native Stripe Checkout UI; it deep-links out. */
export function getMobileMembershipUrl() {
  return getMembershipWebUrl(WEB_BASE_URL);
}

export function isMobileMembershipConfigured() {
  return Boolean(WEB_BASE_URL);
}
