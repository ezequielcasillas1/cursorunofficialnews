import { getPublicWebBase } from '../store/bmc-members.js';
import {
  getMembershipClaimTtlMinutes,
} from '../store/membership-claim-requests.js';
import {
  getResendClient,
  getTransactionalFromAddress,
  isResendConfigured,
} from '../notifications/resend-client.js';

export function isMembershipClaimEmailConfigured() {
  return isResendConfigured();
}

export function buildMembershipClaimUrl(token) {
  const base = getPublicWebBase().replace(/\/$/, '');
  return `${base}/?adfree_claim_token=${encodeURIComponent(token)}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendMembershipClaimEmail({ email, claimToken }) {
  if (!isMembershipClaimEmailConfigured()) {
    throw new Error('Membership email verification is unavailable right now.');
  }

  const resend = getResendClient();
  const from = getTransactionalFromAddress();
  const claimUrl = buildMembershipClaimUrl(claimToken);
  const ttlMinutes = getMembershipClaimTtlMinutes();

  const subject = 'Verify ad-free access for Unofficial Cursor News';
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
              <h1 style="margin:0;color:#faf7f2;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;line-height:1.2;">Verify ad-free access</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#1c1c24;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.6;">
                If you requested supporter access for <strong>${escapeHtml(email)}</strong>, use the button below to verify control of this email and hide ads on the site.
              </p>
              <p style="margin:0 0 24px;color:#5c5c6a;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;">
                This link expires in ${ttlMinutes} minutes.
              </p>
              <p style="margin:0 0 24px;">
                <a href="${escapeHtml(claimUrl)}" style="display:inline-block;background:#0d1b2a;border-radius:6px;color:#faf7f2;font-family:Inter,Arial,sans-serif;font-size:14px;font-weight:600;padding:12px 18px;text-decoration:none;">Verify email and hide ads</a>
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
    `If you requested supporter access for ${email}, verify it here:`,
    claimUrl,
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
    { idempotencyKey: `membership-claim/${claimToken}` },
  );

  if (error) {
    throw new Error(error.message || 'Membership email verification is unavailable right now.');
  }

  return { claimUrl };
}
