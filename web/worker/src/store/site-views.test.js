import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getViewCount, incrementViewCount } from './site-views.js';

function createMockDb(initialCount = 0) {
  let viewCount = initialCount;

  return {
    prepare(sql) {
      const query = String(sql);
      return {
        bind(...params) {
          return {
            async first() {
              if (query.includes('SELECT view_count FROM site_stats')) {
                return { view_count: viewCount };
              }
              return null;
            },
            async run() {
              if (query.includes('UPDATE site_stats SET view_count = view_count + 1')) {
                viewCount += 1;
                return { meta: { changes: 1 } };
              }
              return { meta: { changes: 0 } };
            },
          };
        },
      };
    },
  };
}

describe('site-views store', () => {
  it('returns zero when no row is present', async () => {
    const db = {
      prepare() {
        return {
          bind() {
            return { async first() { return null; } };
          },
        };
      },
    };
    assert.equal(await getViewCount(db), 0);
  });

  it('reads and increments the persisted count', async () => {
    const db = createMockDb(41);
    assert.equal(await getViewCount(db), 41);
    assert.equal(await incrementViewCount(db), 42);
    assert.equal(await getViewCount(db), 42);
  });
});
