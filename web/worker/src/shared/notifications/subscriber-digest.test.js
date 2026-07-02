import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSubscriberDigestSections } from './subscriber-digest.js';

const subscriber = {
  categories: ['changelog', 'blog'],
  categoryLimits: { changelog: 2, blog: 1 },
  officialOnly: true,
};

const items = [
  {
    id: 'c1',
    category: 'changelog',
    sourceId: 'cursor-changelog-rss',
    title: 'Official changelog',
    publishedAt: '2026-07-02T10:00:00Z',
  },
  {
    id: 'c2',
    category: 'changelog',
    sourceId: 'reddit-cursor',
    title: 'Community changelog',
    publishedAt: '2026-07-01T10:00:00Z',
  },
  {
    id: 'b1',
    category: 'blog',
    sourceId: 'cursor-blog-scrape',
    title: 'Official blog',
    publishedAt: '2026-07-02T09:00:00Z',
  },
];

test('buildSubscriberDigestSections filters to official sources when officialOnly is set', () => {
  const sections = buildSubscriberDigestSections(items, subscriber);

  assert.deepEqual(
    sections.map((section) => section.categoryId),
    ['changelog', 'blog'],
  );
  assert.equal(sections[0].items.length, 1);
  assert.equal(sections[0].items[0].id, 'c1');
  assert.equal(sections[1].items[0].id, 'b1');
});

test('buildSubscriberDigestSections keeps community items when officialOnly is false', () => {
  const sections = buildSubscriberDigestSections(items, {
    ...subscriber,
    officialOnly: false,
  });

  assert.equal(sections[0].items.length, 2);
  assert.equal(sections[0].items[0].id, 'c1');
});
