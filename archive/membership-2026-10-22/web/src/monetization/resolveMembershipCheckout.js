const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates membership checkout before Stripe is called.
 * Command payload only — does not start checkout.
 */
export function resolveMembershipCheckout({ email, amount, allowedAmounts }) {
  const trimmed = String(email || '').trim();
  if (!trimmed) {
    return { ok: false, error: 'Enter the email that will own this membership' };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, error: 'Enter a valid email address' };
  }

  const selected = Number(amount);
  const allowed = Array.isArray(allowedAmounts) ? allowedAmounts : [];
  if (!Number.isInteger(selected) || !allowed.includes(selected)) {
    return { ok: false, error: 'Choose a monthly amount' };
  }

  return { ok: true, email: trimmed, amount: selected };
}
