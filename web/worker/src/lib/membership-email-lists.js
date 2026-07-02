import { normalizeEmail } from '../store/email-subscribers.js';

function parseEmailList(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

export function getDevMemberEmails(env) {
  return parseEmailList(env?.MEMBERSHIP_DEV_EMAILS);
}

export function getNewsletterFreeEmails(env) {
  return parseEmailList(env?.NEWSLETTER_FREE_EMAILS);
}

export function isDevMemberEmail(email, env) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getDevMemberEmails(env).includes(normalized);
}

export function isNewsletterFreeEmail(email, env) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getNewsletterFreeEmails(env).includes(normalized);
}

export function isDevMembershipBypassEnabled(env) {
  if (env?.ENVIRONMENT === 'production') return false;
  return env?.DEV_BYPASS_MEMBERSHIP?.trim().toLowerCase() === 'true';
}

export function getPrimaryDevMemberEmail(env) {
  return getDevMemberEmails(env)[0] || null;
}
