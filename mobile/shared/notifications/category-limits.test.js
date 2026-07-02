import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyCategoryLimits,
  buildDigestSections,
  flattenDigestSections,
} from './category-limits.js';

const subscriber = {
  categories: ['changelog', 'blog', 'forum'],
  categoryLimits: {
    changelog: 2,
    blog: 1,
    forum: 3,
  },
};

const items = [
  { id: 'c1', category: 'changelog', title: 'C1', publishedAt: '2026-07-02T10:00:00Z' },
  { id: 'c2', category: 'changelog', title: 'C2', publishedAt: '2026-07-01T10:00:00Z' },
  { id: 'c3', category: 'changelog', title: 'C3', publishedAt: '2026-06-30T10:00:00Z' },
  { id: 'b1', category: 'blog', title: 'B1', publishedAt: '2026-07-02T09:00:00Z' },
  { id: 'b2', category: 'blog', title: 'B2', publishedAt: '2026-07-01T09:00:00Z' },
  { id: 'f1', category: 'forum', title: 'F1', publishedAt: '2026-07-02T08:00:00Z' },
  { id: 'x1', category: 'social', title: 'S1', publishedAt: '2026-07-02T07:00:00Z' },
];

test('buildDigestSections respects enabled topics and per-category limits', () => {
  const sections = buildDigestSections(items, subscriber);

  assert.equal(sections.length, 3);
  assert.deepEqual(
    sections.map((section) => section.categoryId),
    ['changelog', 'blog', 'forum'],
  );
  assert.equal(sections[0].items.length, 2);
  assert.equal(sections[1].items.length, 1);
  assert.equal(sections[2].items.length, 1);
  assert.equal(sections[1].items[0].id, 'b1');
  assert.equal(sections[0].items[0].id, 'c1');
});

test('applyCategoryLimits matches flattened digest sections', () => {
  const sections = buildDigestSections(items, subscriber);
  assert.deepEqual(applyCategoryLimits(items, subscriber), flattenDigestSections(sections));
});

test('buildDigestSections skips disabled categories with no items', () => {
  const sparseSubscriber = {
    categories: ['changelog', 'release', 'blog'],
    categoryLimits: { changelog: 1, release: 2, blog: 1 },
  };
  const sparseItems = [
    { id: 'c1', category: 'changelog', title: 'C1', publishedAt: '2026-07-02T10:00:00Z' },
    { id: 'b1', category: 'blog', title: 'B1', publishedAt: '2026-07-02T09:00:00Z' },
  ];

  const sections = buildDigestSections(sparseItems, sparseSubscriber);
  assert.deepEqual(
    sections.map((section) => section.categoryId),
    ['changelog', 'blog'],
  );
});
