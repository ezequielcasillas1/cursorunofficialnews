/** Web membership section — mobile deep-links out to the website's Stripe Checkout flow. */
export function getMembershipWebUrl(webBaseUrl) {
  const base = String(webBaseUrl || '').trim().replace(/\/$/, '');
  if (!base) return '';
  return `${base}/#membership-section`;
}
