import test from 'node:test';
import assert from 'node:assert/strict';

import { assembleEmailDigest } from './assemble-email.js';

const sections = [
  {
    categoryId: 'changelog',
    items: [{ id: '1', category: 'changelog', title: 'A', publishedAt: '2026-07-02T10:00:00Z' }],
  },
  {
    categoryId: 'blog',
    items: [{ id: '2', category: 'blog', title: 'B', publishedAt: '2026-07-02T09:00:00Z' }],
  },
  {
    categoryId: 'forum',
    items: [{ id: '3', category: 'forum', title: 'C', publishedAt: '2026-07-02T08:00:00Z' }],
  },
];

test('assembleEmailDigest uses N-1 category dividers', () => {
  const digest = assembleEmailDigest({ sections }, { unsubscribeUrl: 'https://example.com/u' });

  assert.equal(digest.dividerCount, 2);
  assert.equal(digest.itemCount, 3);

  const categoryDividerRows = digest.html.match(/padding:20px 0 8px 0/g) || [];
  assert.equal(categoryDividerRows.length, 2);
  assert.match(digest.text, /CHANGELOG/);
  assert.match(digest.text, /BLOG/);
  assert.match(digest.text, /FORUM/);
});

test('assembleEmailDigest adds no divider for a single category', () => {
  const digest = assembleEmailDigest(
    { sections: [sections[0]] },
    { unsubscribeUrl: 'https://example.com/u' },
  );

  assert.equal(digest.dividerCount, 0);
  assert.equal((digest.html.match(/padding:20px 0 8px 0/g) || []).length, 0);
});

test('assembleEmailDigest uses editorial dark theme fonts and masthead', () => {
  const digest = assembleEmailDigest({ sections }, { unsubscribeUrl: 'https://example.com/u' });

  assert.match(digest.html, /Bodoni Moda/);
  assert.match(digest.html, /Libre Caslon Text/);
  assert.match(digest.html, /Libre Franklin/);
  assert.match(digest.html, /Your morning briefing on Cursor/);
  assert.match(digest.html, /background:#0a0a0f/);
  assert.match(digest.html, /#d4b87a/);
});

test('assembleEmailDigest shows Official only badge when subscriber filters official sources', () => {
  const digest = assembleEmailDigest(
    { sections: [sections[0]] },
    { unsubscribeUrl: 'https://example.com/u', subscriber: { officialOnly: true, categories: ['changelog'] } },
  );

  assert.match(digest.html, />Official only</);
  assert.match(digest.text, /Filter: Official only/);
  assert.match(digest.text, /from official sources/);
});
