import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const LIMITS_PATH = fileURLToPath(
  new URL('../../shared/notifications/category-limits.js', import.meta.url),
);

test('normalizeCategoryLimits clamps to enabled categories and 1–3 range', async () => {
  const {
    normalizeCategoryLimits,
    applyCategoryLimits,
    DEFAULT_CATEGORY_ITEM_LIMIT,
  } = await import(`${pathToFileURL(LIMITS_PATH).href}?t=${Date.now()}`);

  assert.deepEqual(
    normalizeCategoryLimits({ changelog: 5, blog: 0, forum: 2 }, ['changelog', 'blog']),
    { changelog: 3, blog: 1 },
  );

  assert.deepEqual(
    normalizeCategoryLimits({}, ['changelog']),
    { changelog: DEFAULT_CATEGORY_ITEM_LIMIT },
  );

  const items = [
    { id: '1', category: 'changelog', publishedAt: '2026-06-30T12:00:00.000Z' },
    { id: '2', category: 'changelog', publishedAt: '2026-06-29T12:00:00.000Z' },
    { id: '3', category: 'changelog', publishedAt: '2026-06-28T12:00:00.000Z' },
    { id: '4', category: 'blog', publishedAt: '2026-06-30T11:00:00.000Z' },
  ];

  const limited = applyCategoryLimits(items, {
    categories: ['changelog', 'blog'],
    categoryLimits: { changelog: 2, blog: 1 },
  });

  assert.equal(limited.length, 3);
  assert.deepEqual(
    limited.map((item) => item.id),
    ['1', '4', '2'],
  );
});
