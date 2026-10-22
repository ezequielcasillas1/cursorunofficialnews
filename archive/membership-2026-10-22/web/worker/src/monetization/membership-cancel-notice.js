/** Public-safe last paid invoice for cancel receipts (email + screen). */
export function summarizePaidInvoice(invoice) {
  if (!invoice?.id) return null;

  const amountPaid = Number(invoice.amount_paid);
  const currency = String(invoice.currency || 'usd').toLowerCase();
  const paidAtUnix = invoice.status_transitions?.paid_at || invoice.created || null;

  return {
    id: invoice.id,
    number: invoice.number || null,
    amountPaidCents: Number.isFinite(amountPaid) ? amountPaid : null,
    currency,
    paidAt: paidAtUnix ? new Date(paidAtUnix * 1000).toISOString() : null,
    hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    invoicePdf: invoice.invoice_pdf || null,
  };
}

export function formatUsdFromCents(cents, currency = 'usd') {
  if (!Number.isFinite(cents)) return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `$${(cents / 100).toFixed(2)}`;
  }
}

export function formatNoticeDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export async function fetchLatestPaidInvoiceSummary(stripe, subscriptionId) {
  if (!stripe || !subscriptionId) return null;
  const invoices = await stripe.invoices.list({
    subscription: subscriptionId,
    status: 'paid',
    limit: 1,
  });
  return summarizePaidInvoice(invoices?.data?.[0]);
}

export function buildMembershipCancelNotice({
  email,
  immediate = false,
  alreadyScheduled = false,
  currentPeriodEnd = null,
  invoice = null,
} = {}) {
  const accessUntil = formatNoticeDate(currentPeriodEnd);
  const amountLabel = invoice
    ? formatUsdFromCents(invoice.amountPaidCents, invoice.currency)
    : null;

  let headline;
  let summary;
  if (immediate) {
    headline = 'Membership cancelled';
    summary = 'Your membership has been cancelled. Newsletter access has ended.';
  } else if (alreadyScheduled) {
    headline = 'Cancellation already scheduled';
    summary = accessUntil
      ? `Cancellation is already scheduled. You keep access until ${accessUntil}, and billing will not renew.`
      : 'Cancellation is already scheduled. You keep access until the end of the billing period.';
  } else {
    headline = 'Cancellation scheduled';
    summary = accessUntil
      ? `Membership cancellation scheduled. You keep access until ${accessUntil}, and billing will not renew.`
      : 'Membership cancellation scheduled. You keep access until the end of your billing period.';
  }

  return {
    email: email || null,
    headline,
    summary,
    immediate: Boolean(immediate),
    alreadyScheduled: Boolean(alreadyScheduled),
    currentPeriodEnd: currentPeriodEnd || null,
    accessUntil,
    invoice: invoice ? { ...invoice, amountLabel } : null,
  };
}

export function cancelNoticeIdempotencyKey({
  email,
  subscriptionId,
  currentPeriodEnd,
  immediate,
} = {}) {
  const scope = String(subscriptionId || email || 'unknown').slice(0, 80);
  const when = immediate ? 'immediate' : currentPeriodEnd || 'period-end';
  return `membership-cancel-notice/${scope}/${when}`.slice(0, 256);
}
