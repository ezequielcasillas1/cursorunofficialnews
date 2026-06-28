import crypto from 'crypto';
import { normalizeEmail, isValidEmail } from './email-subscribers.js';
import { loadJsonFile, saveJsonFile } from './json-persist.js';

const FILENAME = 'bmc-members.json';

/** @type {Map<string, object>} */
const members = new Map();
/** @type {Map<string, string>} token -> email */
const tokensByValue = new Map();

function generateAdFreeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function indexToken(record) {
  if (record?.adFreeToken) {
    tokensByValue.set(record.adFreeToken, record.email);
  }
}

function loadFromDisk() {
  const rows = loadJsonFile(FILENAME, []);
  members.clear();
  tokensByValue.clear();

  for (const row of rows) {
    if (!row?.email) continue;
    if (!row.adFreeToken) {
      row.adFreeToken = generateAdFreeToken();
    }
    members.set(row.email, row);
    indexToken(row);
  }
}

function saveToDisk() {
  saveJsonFile(FILENAME, [...members.values()]);
}

loadFromDisk();

function buildRecord(email, existing) {
  return {
    email,
    adFreeToken: existing?.adFreeToken || generateAdFreeToken(),
    active: true,
    membershipStartedAt: existing?.membershipStartedAt || new Date().toISOString(),
    cancelledAt: null,
    updatedAt: new Date().toISOString(),
  };
}

export function activateMember(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('Invalid supporter email from webhook');
  }

  const existing = members.get(normalized);
  const record = buildRecord(normalized, existing);
  members.set(normalized, record);
  indexToken(record);
  saveToDisk();
  return record;
}

export function deactivateMember(email) {
  const normalized = normalizeEmail(email);
  const existing = members.get(normalized);
  if (!existing) return false;

  existing.active = false;
  existing.cancelledAt = new Date().toISOString();
  existing.updatedAt = new Date().toISOString();
  members.set(normalized, existing);
  saveToDisk();
  return true;
}

export function getMemberByToken(token) {
  if (!token) return null;
  const email = tokensByValue.get(token);
  if (!email) return null;
  return members.get(email) || null;
}

export function getMember(email) {
  return members.get(normalizeEmail(email)) || null;
}

export function claimAdFreeAccess(email) {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new Error('A valid email address is required');
  }

  const member = members.get(normalized);
  if (!member?.active) {
    return null;
  }

  return {
    email: member.email,
    adFreeToken: member.adFreeToken,
    active: true,
  };
}

export function getAdFreeStatus(token) {
  const member = getMemberByToken(token);
  if (!member?.active) {
    return { adFree: false, email: null };
  }

  return { adFree: true, email: member.email };
}

export function listMembers() {
  return [...members.values()];
}

/** Dev helper — comma-separated emails in BMC_DEV_ADFREE_EMAILS */
export function isDevAdFreeEmail(email) {
  const raw = process.env.BMC_DEV_ADFREE_EMAILS?.trim();
  if (!raw) return false;
  const allowed = raw.split(',').map((e) => normalizeEmail(e)).filter(Boolean);
  return allowed.includes(normalizeEmail(email));
}

export function getPublicWebBase() {
  return (
    process.env.PUBLIC_WEB_BASE?.trim() ||
    process.env.VITE_PUBLIC_WEB_BASE?.trim() ||
    'https://cursorunofficial.news'
  );
}

export function buildAdFreeActivationUrl(token) {
  const base = getPublicWebBase().replace(/\/$/, '');
  return `${base}/?adfree_token=${encodeURIComponent(token)}`;
}
