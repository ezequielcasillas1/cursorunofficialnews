import { VALID_CATEGORY_IDS } from '../shared/notifications/constants.js';

const VALID_CATEGORIES = new Set(VALID_CATEGORY_IDS);

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return [...new Set(categories.filter((c) => VALID_CATEGORIES.has(c)))];
}

function rowToDevice(row) {
  return {
    token: row.token,
    platform: row.platform,
    categories: JSON.parse(row.categories_json || '[]'),
    enabled: Boolean(row.enabled),
    registeredAt: row.registered_at,
    updatedAt: row.updated_at,
  };
}

export async function registerDevice(db, { token, platform, categories = [], enabled = true }) {
  if (!token) throw new Error('token is required');

  const existingRow = await db.prepare('SELECT * FROM device_tokens WHERE token = ?').bind(token).first();
  const isEnabled = Boolean(enabled);
  const normalizedCategories = isEnabled ? normalizeCategories(categories) : [];
  const now = new Date().toISOString();

  const record = {
    token,
    platform: platform || existingRow?.platform || 'unknown',
    categories: normalizedCategories,
    enabled: isEnabled,
    registeredAt: existingRow?.registered_at || now,
    updatedAt: now,
  };

  await db
    .prepare(
      `INSERT INTO device_tokens (token, platform, categories_json, enabled, registered_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(token) DO UPDATE SET
         platform = excluded.platform,
         categories_json = excluded.categories_json,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at`,
    )
    .bind(
      record.token,
      record.platform,
      JSON.stringify(record.categories),
      record.enabled ? 1 : 0,
      record.registeredAt,
      record.updatedAt,
    )
    .run();

  return record;
}

export async function unregisterDevice(db, token) {
  const result = await db.prepare('DELETE FROM device_tokens WHERE token = ?').bind(token).run();
  return (result.meta?.changes || 0) > 0;
}

export async function listDevices(db) {
  const { results } = await db.prepare('SELECT * FROM device_tokens').all();
  return results.map(rowToDevice);
}

export async function getSubscribedDevices(db, category) {
  const devices = await listDevices(db);
  return devices.filter((d) => d.enabled && (!category || d.categories.includes(category)));
}

export { normalizeCategories as normalizeDeviceCategories };
