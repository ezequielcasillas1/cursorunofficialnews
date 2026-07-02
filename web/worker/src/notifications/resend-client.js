import { Resend } from 'resend';

export function isResendConfigured(env) {
  return Boolean(env?.RESEND_API_KEY?.trim());
}

export function getTransactionalFromAddress(env) {
  return (
    env?.RESEND_FROM_EMAIL?.trim() ||
    'Unofficial Cursor News <onboarding@resend.dev>'
  );
}

export function getResendClient(env) {
  const apiKey = env?.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(apiKey);
}
