import { isSiteOffline } from '../ops/site-offline.js';

export const MEMBERSHIP_BILLING_OFFLINE_ERROR = 'Membership billing is temporarily unavailable';

/** Hard-disable checkout / webhook / claim while the public site is offline. */
export function isMembershipBillingOffline(env) {
  return isSiteOffline(env);
}

/** @param {import('hono').Context} c */
export function membershipBillingOfflineJson(c) {
  c.header('Cache-Control', 'no-store');
  return c.json({ error: MEMBERSHIP_BILLING_OFFLINE_ERROR, offline: true }, 503);
}
