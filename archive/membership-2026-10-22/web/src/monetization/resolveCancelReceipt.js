/**
 * Maps the cancel API payload into a receipt the unsubscribe page can render.
 * Falls back to local copy when the Worker omits `notice`.
 */
export function resolveCancelReceipt(data) {
  if (!data) return null;

  const notice = data.notice || {};
  const summary =
    notice.summary ||
    (data.immediate
      ? 'Your membership has been cancelled. Newsletter access has ended on this device.'
      : null);
  if (!summary && !notice.headline) return null;

  const invoice = notice.invoice || null;
  const emailedTo = notice.email || data.email || null;

  const immediate = Boolean(notice.immediate || data.immediate);

  return {
    headline: notice.headline || (immediate ? 'Membership cancelled' : 'Cancellation scheduled'),
    summary,
    emailed: Boolean(notice.emailed),
    emailedTo,
    accessUntil: notice.accessUntil || null,
    immediate,
    canResubscribe: !immediate,
    invoice: invoice?.hostedInvoiceUrl || invoice?.number || invoice?.amountLabel ? invoice : null,
  };
}
