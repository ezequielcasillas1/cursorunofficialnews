/** Google AdSense publisher client ID, e.g. ca-pub-xxxxxxxxxxxxxxxx */
export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID?.trim() || '';

/** Optional display ad slot ID — create a Display ad unit in AdSense, then paste the slot ID here. */
export const ADSENSE_SLOT_ID =
  import.meta.env.VITE_ADSENSE_SLOT_ID?.trim() ||
  import.meta.env.VITE_ADSENSE_SLOT?.trim() ||
  '';

export function isAdSenseConfigured() {
  return Boolean(ADSENSE_CLIENT_ID);
}
