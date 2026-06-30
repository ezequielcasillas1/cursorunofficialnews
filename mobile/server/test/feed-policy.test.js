import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FEED_PUBLISHED_AFTER_ISO,
  FEED_PUBLISHED_AFTER_MS,
  filterItemsByFeedPolicy,
  isItemWithinFeedWindow,
} from '../../shared/feed/feedPolicy.js';

test('feed policy cut is 2025-01-01', () => {
  assert.equal(FEED_PUBLISHED_AFTER_ISO, '2025-01-01T00:00:00.000Z');
  assert.equal(FEED_PUBLISHED_AFTER_MS, Date.parse('2025-01-01T00:00:00.000Z'));
});

test('isItemWithinFeedWindow excludes dated items before 2025', () => {
  assert.equal(
    isItemWithinFeedWindow({
      category: 'changelog',
      publishedAt: '2024-12-31T23:59:59.999Z',
    }),
    false,
  );
  assert.equal(
    isItemWithinFeedWindow({
      category: 'forum',
      publishedAt: '2025-01-01T00:00:00.000Z',
    }),
    true,
  );
});

test('isItemWithinFeedWindow keeps undated catalog items', () => {
  assert.equal(
    isItemWithinFeedWindow({
      category: 'tutorial',
      publishedAt: null,
    }),
    true,
  );
});

test('filterItemsByFeedPolicy drops pre-2025 dated items', () => {
  const filtered = filterItemsByFeedPolicy([
    { id: 'old', publishedAt: '2023-06-01T00:00:00.000Z', category: 'blog' },
    { id: 'new', publishedAt: '2025-06-01T00:00:00.000Z', category: 'blog' },
    { id: 'undated', publishedAt: null, category: 'tutorial' },
  ]);
  assert.deepEqual(filtered.map((item) => item.id), ['new', 'undated']);
});
