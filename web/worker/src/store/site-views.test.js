import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionId,
  getActiveVisitorCount,
  isValidSessionId,
  pruneStalePresence,
  recordPresence,
  touchPresence,
} from './site-views.js';

function createMockDb(initialSessions = []) {
  const sessions = new Map(
    initialSessions.map(({ session_id, last_seen }) => [session_id, last_seen]),
  );
  let lastNowModifier = '-2 minutes';

  return {
    sessions,
    lastNowModifier,
    prepare(sql) {
      const query = String(sql);

      async function runBound(...params) {
        if (query.includes('CREATE TABLE') || query.includes('CREATE INDEX')) {
          return { meta: { changes: 0 } };
        }

        if (query.includes('DELETE FROM site_presence')) {
          lastNowModifier = params[0];
          const cutoff = Date.now() - 2 * 60 * 1000;
          for (const [id, lastSeen] of sessions.entries()) {
            if (new Date(lastSeen).getTime() < cutoff) {
              sessions.delete(id);
            }
          }
          return { meta: { changes: 1 } };
        }

        if (query.includes('INSERT INTO site_presence')) {
          const [sessionId] = params;
          sessions.set(sessionId, new Date().toISOString());
          return { meta: { changes: 1 } };
        }

        return { meta: { changes: 0 } };
      }

      return {
        bind(...params) {
          if (query.includes('DELETE FROM site_presence')) {
            lastNowModifier = params[0];
          }
          return {
            async first() {
              if (query.includes('SELECT COUNT(*) AS count FROM site_presence')) {
                lastNowModifier = params[0];
                const cutoff = Date.now() - 2 * 60 * 1000;
                let count = 0;
                for (const lastSeen of sessions.values()) {
                  if (new Date(lastSeen).getTime() >= cutoff) count += 1;
                }
                return { count };
              }
              return null;
            },
            run: () => runBound(...params),
          };
        },
        run: () => runBound(),
      };
    },
  };
}

describe('site presence store', () => {
  it('validates opaque session ids', () => {
    assert.equal(isValidSessionId(createSessionId()), true);
    assert.equal(isValidSessionId('not-a-uuid'), false);
    assert.equal(isValidSessionId(''), false);
  });

  it('returns zero when no sessions are active', async () => {
    const db = createMockDb();
    assert.equal(await getActiveVisitorCount(db), 0);
  });

  it('records a heartbeat and counts active sessions', async () => {
    const db = createMockDb();
    const sessionId = createSessionId();

    assert.equal(await recordPresence(db, sessionId), 1);
    await touchPresence(db, createSessionId());
    assert.equal(await getActiveVisitorCount(db), 2);
  });

  it('prunes stale sessions before counting', async () => {
    const staleId = createSessionId();
    const freshId = createSessionId();
    const db = createMockDb([
      { session_id: staleId, last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { session_id: freshId, last_seen: new Date().toISOString() },
    ]);

    await pruneStalePresence(db);
    assert.equal(await getActiveVisitorCount(db), 1);
  });
});
