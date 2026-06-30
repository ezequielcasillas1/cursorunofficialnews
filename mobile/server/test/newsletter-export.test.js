import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

async function withEnv(overrides, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('newsletter export includes verified subscribers and matching items', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cain-newsletter-export-'));

  await withEnv({ DATA_DIR: tempDir }, async () => {
    const store = await import('../src/store/email-subscribers.js');
    const cache = await import('../src/store/memory-cache.js');
    const { buildNewsletterExport } = await import('../src/notifications/newsletter-export.js');

    cache.replaceItems([
      {
        id: 'item-1',
        title: 'Changelog update',
        category: 'changelog',
        canonicalUrl: 'https://cursor.com/changelog/1',
        publishedAt: '2026-06-30T12:00:00.000Z',
        sourceId: 'cursor-changelog',
        sourceName: 'Cursor Changelog',
      },
      {
        id: 'item-2',
        title: 'Blog post',
        category: 'blog',
        canonicalUrl: 'https://cursor.com/blog/1',
        publishedAt: '2026-06-29T12:00:00.000Z',
        sourceId: 'cursor-blog',
        sourceName: 'Cursor Blog',
      },
    ]);

    const pending = store.subscribeEmail({
      email: 'reader@example.com',
      categories: ['changelog'],
      categoryLimits: { changelog: 2 },
      enabled: true,
    });
    store.verifySubscriberByToken(pending.verificationToken);

    const payload = buildNewsletterExport({
      newItems: [
        {
          id: 'item-1',
          title: 'Changelog update',
          category: 'changelog',
          canonicalUrl: 'https://cursor.com/changelog/1',
          publishedAt: '2026-06-30T12:00:00.000Z',
          sourceId: 'cursor-changelog',
          sourceName: 'Cursor Changelog',
        },
      ],
    });

    assert.equal(payload.subscriberCount, 1);
    assert.equal(payload.subscribers[0].email, 'reader@example.com');
    assert.deepEqual(payload.subscribers[0].categoryLimits, { changelog: 2 });
    assert.equal(payload.subscribers[0].matchingNewItems.length, 1);
    assert.equal(payload.subscribers[0].matchingRecentItems.length, 1);
    assert.match(payload.subscribers[0].unsubscribeUrl, /\/v1\/email\/unsubscribe\?token=/);
  });
});
