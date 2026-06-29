import { Resend } from 'resend';

let resendClient = null;

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getTransactionalFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'Unofficial Cursor News <onboarding@resend.dev>'
  );
}

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
