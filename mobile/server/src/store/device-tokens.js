import { VALID_CATEGORY_IDS } from '../../../shared/notifications/constants.js';
import { loadJsonFile, saveJsonFile } from './json-persist.js';

const FILENAME = 'device-tokens.json';
const VALID_CATEGORIES = new Set(VALID_CATEGORY_IDS);

/** @type {Map<string, object>} */
const devices = new Map();

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return [...new Set(categories.filter((c) => VALID_CATEGORIES.has(c)))];
}

function loadFromDisk() {
  const rows = loadJsonFile(FILENAME, []);
  devices.clear();
  for (const row of rows) {
    if (row?.token) {
      devices.set(row.token, row);
    }
  }
}

function saveToDisk() {
  saveJsonFile(FILENAME, [...devices.values()]);
}

loadFromDisk();

export function registerDevice({
  token,
  platform,
  categories = [],
  enabled = true,
}) {
  if (!token) throw new Error('token is required');
  const isEnabled = Boolean(enabled);
  const normalizedCategories = isEnabled ? normalizeCategories(categories) : [];
  const existing = devices.get(token);
  const record = {
    token,
    platform: platform || existing?.platform || 'unknown',
    categories: normalizedCategories,
    enabled: isEnabled,
    registeredAt: existing?.registeredAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  devices.set(token, record);
  saveToDisk();
  return record;
}

export function unregisterDevice(token) {
  const removed = devices.delete(token);
  if (removed) saveToDisk();
  return removed;
}

export function listDevices() {
  return [...devices.values()];
}

export function getSubscribedDevices(category) {
  return listDevices().filter(
    (d) => d.enabled && (!category || d.categories.includes(category)),
  );
}

export { normalizeCategories as normalizeDeviceCategories };
