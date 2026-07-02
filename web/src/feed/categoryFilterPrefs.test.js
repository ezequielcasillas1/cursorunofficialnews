import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildFeedQueryFilters,
  createDefaultCategoryFilters,
  getActiveCategoryFilter,
  getSourcesForCategoryTab,
  migrateFilterPrefs,
  normalizeCategoryFilter,
  toggleSourceFilter,
} from './categoryFilterPrefs.js';

test('migrateFilterPrefs upgrades legacy officialOnly to all tabs', () => {
  const migrated = migrateFilterPrefs({ category: 'forum', officialOnly: true });
  assert.equal(migrated.category, 'forum');
  assert.equal(migrated.categoryFilters.forum.officialOnly, true);
  assert.equal(migrated.categoryFilters.all.officialOnly, true);
});

test('buildFeedQueryFilters maps official and source ids', () => {
  assert.deepEqual(buildFeedQueryFilters({ officialOnly: true, sourceIds: null }), {
    official: true,
    sources: undefined,
  });
  assert.deepEqual(
    buildFeedQueryFilters({ officialOnly: false, sourceIds: ['cursor-changelog-rss'] }),
    { official: undefined, sources: ['cursor-changelog-rss'] },
  );
});

test('toggleSourceFilter adds and removes source ids', () => {
  const first = toggleSourceFilter({ officialOnly: false, sourceIds: null }, 'a');
  assert.deepEqual(first.sourceIds, ['a']);
  const cleared = toggleSourceFilter(first, 'a');
  assert.equal(cleared.sourceIds, null);
});

test('getSourcesForCategoryTab limits sources to tab categories', () => {
  const sources = [
    { id: '1', category: 'changelog', enabled: true },
    { id: '2', category: 'blog', enabled: true },
    { id: '3', category: 'release', enabled: false },
  ];
  const updates = getSourcesForCategoryTab(sources, 'updates');
  assert.deepEqual(
    updates.map((s) => s.id),
    ['1'],
  );
});

test('getActiveCategoryFilter returns normalized per-tab prefs', () => {
  const filters = createDefaultCategoryFilters();
  filters.tutorials = { officialOnly: true, sourceIds: ['cursor-learn-tutorials'] };
  const active = getActiveCategoryFilter(filters, 'tutorials');
  assert.deepEqual(active, normalizeCategoryFilter(filters.tutorials));
});
