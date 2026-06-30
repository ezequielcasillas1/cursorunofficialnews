import { getPublicWebBase } from '../store/bmc-members.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from './resend-client.js';
import { getVerificationTtlMinutes } from '../store/email-subscribers.js';

export function isSubscriptionVerificationEmailConfigured() {
  return isResendConfigured();
}

export function buildSubscriptionVerifyUrl(token) {
  const base = getPublicWebBase().replace(/\/$/, '');
  return `${base}/?newsletter_verify_token=${encodeURIComponent(token)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendSubscriptionVerificationEmail({ email, verificationToken }) {
  if (!isSubscriptionVerificationEmailConfigured()) {
    throw new Error('Email verification is unavailable right now.');
  }

  const resend = getResendClient();
  const from = getTransactionalFromAddress();
  const verifyUrl = buildSubscriptionVerifyUrl(verificationToken);
  const ttlMinutes = getVerificationTtlMinutes();

  const subject = 'Confirm your Unofficial Cursor News digest';
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
              <h1 style="margin:0;color:#faf7f2;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.2;">Confirm your digest</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#1c1c24;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;">
                You asked to receive email digests at <strong>${escapeHtml(email)}</strong>. Confirm below to start receiving headlines when new stories arrive.
              </p>
              <p style="margin:0 0 24px;color:#5c5c6a;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;">
                This link expires in ${ttlMinutes} minutes.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#0d1b2a;border-radius:6px;color:#faf7f2;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 18px;text-decoration:none;">Confirm subscription</a>
              </p>
              <p style="margin:0;color:#8a8a98;font-family:Inter,Arial,sans-serif;font-size:12px;line-height:1.6;">
                If you did not request this, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    'UNOFFICIAL CURSOR NEWS',
    '',
    `Confirm your email digest for ${email}:`,
    verifyUrl,
    '',
    `This link expires in ${ttlMinutes} minutes.`,
    'If you did not request this, you can ignore this email.',
  ].join('\n');

  const { error } = await resend.emails.send(
    {
      from,
      to: [email],
      subject,
      html,
      text,
    },
    { idempotencyKey: `newsletter-verify/${verificationToken}` },
  );

  if (error) {
    throw new Error(error.message || 'Email verification is unavailable right now.');
  }

  return { verifyUrl };
}
