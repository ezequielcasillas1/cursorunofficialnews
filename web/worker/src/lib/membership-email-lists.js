import { normalizeEmail } from '../store/email-subscribers.js';

function parseEmailList(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

let newsletterFreeEmailsWarned = false;

export function getDevMemberEmails(env) {
  return parseEmailList(env?.MEMBERSHIP_DEV_EMAILS);
}

export function getNewsletterFreeEmails(env) {
  const list = parseEmailList(env?.NEWSLETTER_FREE_EMAILS);
  if (env?.ENVIRONMENT === 'production' && list.length > 0 && !newsletterFreeEmailsWarned) {
    newsletterFreeEmailsWarned = true;
    console.warn(
      `[security] NEWSLETTER_FREE_EMAILS is set in production (${list.length} address(es)) — keep this list minimal; remove when no longer needed`,
    );
  }
  return list;
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
