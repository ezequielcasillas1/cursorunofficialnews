import test from 'node:test';
import assert from 'node:assert/strict';

import { assembleEmailDigest, resolveBrandLogoUrl } from './assemble-email.js';

const sections = [
  {
    categoryId: 'changelog',
    items: [
      {
        id: '1',
        category: 'changelog',
        title: 'A',
        publishedAt: '2026-07-02T10:00:00Z',
        excerpt: 'Changelog excerpt',
        canonicalUrl: 'https://cursor.com/changelog',
        sourceName: 'Cursor Changelog',
      },
    ],
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

  const categoryDividerRows = digest.html.match(/padding-top:22px;padding-bottom:10px/g) || [];
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
  assert.equal((digest.html.match(/padding-top:22px;padding-bottom:10px/g) || []).length, 0);
});

test('assembleEmailDigest uses site brand fonts, navy hero, and logo', () => {
  const digest = assembleEmailDigest(
    { sections },
    { unsubscribeUrl: 'https://example.com/u', publicWebBase: 'https://cursorunofficial.news' },
  );

  assert.match(digest.html, /Fraunces/);
  assert.match(digest.html, /Source Serif 4/);
  assert.match(digest.html, /Outfit/);
  assert.match(digest.html, /Your morning briefing on Cursor/);
  assert.match(digest.html, /background-color:#070a0f/);
  assert.match(digest.html, /#c5a977/);
  assert.match(digest.html, /https:\/\/cursorunofficial\.news\/brand\/logo-icon\.png/);
  assert.match(digest.html, /alt="Unofficial Cursor News"/);
  assert.match(digest.html, /Open the full feed/);
  assert.equal(digest.logoUrl, 'https://cursorunofficial.news/brand/logo-icon.png');
});

test('resolveBrandLogoUrl uses public web base', () => {
  assert.equal(
    resolveBrandLogoUrl('https://cursorunofficial.news/'),
    'https://cursorunofficial.news/brand/logo-icon.png',
  );
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
