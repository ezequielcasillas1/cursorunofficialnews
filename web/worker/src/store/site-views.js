/** Live site presence — heartbeat + TTL window (see routes POST/GET /v1/views). */

export const PRESENCE_TTL_MINUTES = 2;
const PRESENCE_TTL_MODIFIER = `-${PRESENCE_TTL_MINUTES} minutes`;
const SESSION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidSessionId(value) {
  return SESSION_ID_RE.test(String(value || '').trim());
}

export function createSessionId() {
  return crypto.randomUUID();
}

export async function pruneStalePresence(db) {
  await db
    .prepare('DELETE FROM site_presence WHERE last_seen < datetime(\'now\', ?)')
    .bind(PRESENCE_TTL_MODIFIER)
    .run();
}

export async function getActiveVisitorCount(db) {
  const row = await db
    .prepare(
      'SELECT COUNT(*) AS count FROM site_presence WHERE last_seen >= datetime(\'now\', ?)',
    )
    .bind(PRESENCE_TTL_MODIFIER)
    .first();
  return Number(row?.count ?? 0);
}

export async function touchPresence(db, sessionId) {
  await db
    .prepare(
      `INSERT INTO site_presence (session_id, last_seen)
       VALUES (?, datetime('now'))
       ON CONFLICT(session_id) DO UPDATE SET last_seen = datetime('now')`,
    )
    .bind(sessionId)
    .run();
}

export async function recordPresence(db, sessionId) {
  await touchPresence(db, sessionId);
  await pruneStalePresence(db);
  return getActiveVisitorCount(db);
}
