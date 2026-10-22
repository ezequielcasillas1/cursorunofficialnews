import { getPublicWebBase } from '../lib/env.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from '../notifications/resend-client.js';
import { cancelNoticeIdempotencyKey } from './membership-cancel-notice.js';

export function isMembershipCancelEmailConfigured(env) {
  return isResendConfigured(env);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildMembershipCancelEmailContent(notice, env) {
  const webBase = getPublicWebBase(env).replace(/\/$/, '');
  const cancelUrl = `${webBase}/membership/unsubscribe`;
  const invoice = notice?.invoice || null;
  const subject = notice?.immediate
    ? 'Your Unofficial Cursor News membership is cancelled'
    : 'Your Unofficial Cursor News membership cancellation is scheduled';

  const invoiceHtml = invoice
    ? `<p style="margin:0 0 16px;color:#1c1c24;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;">
         Last invoice${invoice.number ? ` <strong>${escapeHtml(invoice.number)}</strong>` : ''}${
           invoice.amountLabel ? ` — ${escapeHtml(invoice.amountLabel)}` : ''
         }.
       </p>`
    : '';

  const invoiceButton =
    invoice?.hostedInvoiceUrl
      ? `<p style="margin:0 0 24px;">
           <a href="${escapeHtml(invoice.hostedInvoiceUrl)}" style="display:inline-block;background:#0d1b2a;border-radius:6px;color:#faf7f2;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 18px;text-decoration:none;">View invoice</a>
         </p>`
      : `<p style="margin:0 0 24px;">
           <a href="${escapeHtml(cancelUrl)}" style="display:inline-block;background:#0d1b2a;border-radius:6px;color:#faf7f2;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 18px;text-decoration:none;">View cancellation details</a>
         </p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f0ebe3;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebe3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #ddd6c8;border-radius:8px;">
          <tr>
            <td style="background:#0d1b2a;padding:28px 32px 24px;border-radius:8px 8px 0 0;">
              <p style="margin:0 0 8px;color:#e8dcc0;font-family:Inter,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Unofficial · Independent</p>
              <h1 style="margin:0;color:#faf7f2;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.2;">${escapeHtml(
                notice?.headline || 'Membership cancellation',
              )}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#1c1c24;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;">
                ${escapeHtml(notice?.summary || 'Your membership cancellation is confirmed.')}
              </p>
              <p style="margin:0 0 16px;color:#5c5c6a;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;">
                This notice was sent to <strong>${escapeHtml(notice?.email || '')}</strong>.
              </p>
              ${invoiceHtml}
              ${invoiceButton}
              <p style="margin:0;color:#8a8a98;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;">
                If you did not cancel this membership, restore it from the newsletter membership section.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    'UNOFFICIAL CURSOR NEWS',
    '',
    notice?.headline || 'Membership cancellation',
    notice?.summary || 'Your membership cancellation is confirmed.',
    '',
    `Sent to: ${notice?.email || ''}`,
  ];
  if (invoice?.number || invoice?.amountLabel) {
    textLines.push(
      `Last invoice: ${[invoice.number, invoice.amountLabel].filter(Boolean).join(' — ')}`,
    );
  }
  if (invoice?.hostedInvoiceUrl) {
    textLines.push(`View invoice: ${invoice.hostedInvoiceUrl}`);
  }
  if (invoice?.invoicePdf) {
    textLines.push(`Download PDF: ${invoice.invoicePdf}`);
  }
  textLines.push('', `Cancellation details: ${cancelUrl}`);

  return { subject, html, text: textLines.join('\n') };
}

export async function sendMembershipCancelEmail({ notice, idempotencyKey } = {}, env) {
  if (!notice?.email) {
    return { sent: false, skipped: true };
  }
  if (!isMembershipCancelEmailConfigured(env)) {
    return { sent: false, skipped: true };
  }

  const resend = getResendClient(env);
  const from = getTransactionalFromAddress(env);
  const { subject, html, text } = buildMembershipCancelEmailContent(notice, env);
  const key =
    idempotencyKey ||
    cancelNoticeIdempotencyKey({
      email: notice.email,
      currentPeriodEnd: notice.currentPeriodEnd,
      immediate: notice.immediate,
    });

  const { error } = await resend.emails.send(
    {
      from,
      to: [notice.email],
      subject,
      html,
      text,
    },
    { idempotencyKey: key },
  );

  if (error) {
    throw new Error(error.message || 'Could not send membership cancellation email.');
  }

  return { sent: true, skipped: false };
}
