import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const CACHE_MODULE_PATH = fileURLToPath(
  new URL('../src/store/memory-cache.js', import.meta.url),
);

async function withTempDataDir(fn) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cursor-news-cache-'));
  const previous = process.env.DATA_DIR;
  process.env.DATA_DIR = dataDir;

  try {
    return await fn();
  } finally {
    if (previous === undefined) {
      delete process.env.DATA_DIR;
    } else {
      process.env.DATA_DIR = previous;
    }
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

async function loadCacheModule() {
  const url = `${pathToFileURL(CACHE_MODULE_PATH).href}?t=${Date.now()}-${Math.random()}`;
  return import(url);
}

test('getNews with no category returns items sorted by publishedAt desc', async () => {
  await withTempDataDir(async () => {
    const cache = await loadCacheModule();

    cache.replaceItems([
      {
        id: 'tutorial-old',
        sourceId: 'devto-cursor-tutorials',
        category: 'tutorial',
        title: 'Old tutorial',
        publishedAt: '2024-01-01T00:00:00.000Z',
        canonicalUrl: 'https://dev.to/cursor/old',
      },
      {
        id: 'changelog-new',
        sourceId: 'cursor-changelog-rss',
        category: 'changelog',
        title: 'New changelog',
        publishedAt: '2026-06-01T00:00:00.000Z',
        canonicalUrl: 'https://cursor.com/changelog/new',
      },
      {
        id: 'tutorial-new',
        sourceId: 'devto-cursor-tutorials',
        category: 'tutorial',
        title: 'Recent tutorial',
        publishedAt: '2026-05-15T00:00:00.000Z',
        canonicalUrl: 'https://dev.to/cursor/recent',
      },
    ]);

    const result = cache.getNews({ limit: 10 });

    assert.deepEqual(
      result.map((item) => item.id),
      ['changelog-new', 'tutorial-new', 'tutorial-old'],
    );
  });
});

test('sitemap-sourced items lose publishedAt and sink in chronological order', async () => {
  await withTempDataDir(async () => {
    const cache = await loadCacheModule();

    cache.replaceItems([
      {
        id: 'sitemap-tutorial-today',
        sourceId: 'cursor-learn-tutorials',
        category: 'tutorial',
        title: 'Sitemap tutorial dated today',
        publishedAt: new Date().toISOString(),
        canonicalUrl: 'https://cursor.com/learn/agent-mode',
      },
      {
        id: 'changelog-yesterday',
        sourceId: 'cursor-changelog-rss',
        category: 'changelog',
        title: 'Real changelog',
        publishedAt: '2026-06-28T12:00:00.000Z',
        canonicalUrl: 'https://cursor.com/changelog/yesterday',
      },
      {
        id: 'rss-tutorial-old',
        sourceId: 'devto-cursor-tutorials',
        category: 'tutorial',
        title: 'Real RSS tutorial',
        publishedAt: '2026-04-01T00:00:00.000Z',
        canonicalUrl: 'https://dev.to/cursor/old-tutorial',
      },
    ]);

    const result = cache.getNews({ limit: 10 });
    const ids = result.map((item) => item.id);
    const sitemapItem = result.find((item) => item.id === 'sitemap-tutorial-today');

    assert.equal(sitemapItem.publishedAt, null);
    assert.equal(ids[0], 'changelog-yesterday');
    assert.equal(ids[1], 'rss-tutorial-old');
    assert.equal(ids[2], 'sitemap-tutorial-today');
  });
});

test('getNews with category filter still diversifies across sources', async () => {
  await withTempDataDir(async () => {
    const cache = await loadCacheModule();

    const tutorialItems = Array.from({ length: 12 }, (_, index) => ({
      id: `tutorial-${index}`,
      sourceId: 'devto-cursor-tutorials',
      category: 'tutorial',
      title: `Tutorial ${index}`,
      publishedAt: `2026-06-${String(28 - index).padStart(2, '0')}T00:00:00.000Z`,
      canonicalUrl: `https://dev.to/cursor/item-${index}`,
    }));

    const forumItems = Array.from({ length: 4 }, (_, index) => ({
      id: `forum-${index}`,
      sourceId: 'forum-cursor-how-to',
      category: 'tutorial',
      title: `Forum guide ${index}`,
      publishedAt: `2026-06-${String(20 - index).padStart(2, '0')}T00:00:00.000Z`,
      canonicalUrl: `https://forum.cursor.com/t/${index}`,
    }));

    cache.replaceItems([...tutorialItems, ...forumItems]);

    const result = cache.getNews({ category: 'tutorial', limit: 10 });
    const sourceIds = new Set(result.map((item) => item.sourceId));

    assert.equal(result.length, 10);
    assert.equal(sourceIds.size, 2);
  });
});
