/**
 * Strategy for the cancel-membership page. `cancelEligibility === null` means
 * still loading only when a token exists; never treat a fake local unlock as loaded.
 */
export function resolveCancelPageView({
  checking,
  hasEntitlement,
  hasToken,
  cancelEligibility,
}) {
  if (checking) return 'checking';
  if (!hasEntitlement || !hasToken) return 'restore';
  if (cancelEligibility == null) return 'loading';
  if (cancelEligibility.loadError) return 'error';
  if (cancelEligibility.cancellable) return 'cancel';
  return 'inactive';
}
