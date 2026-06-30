import assert from 'node:assert/strict';
import test from 'node:test';

import { listSourcesForApi } from '../src/sources/registry.js';

const PRIVATE_URL_KEYS = ['feedUrl', 'pageUrl', 'sitemapUrl', 'twitterUsername'];

test('listSourcesForApi exposes display metadata only', () => {
  const sources = listSourcesForApi();
  assert.ok(sources.length > 0);

  for (const source of sources) {
    assert.ok(source.id);
    assert.ok(source.name);
    for (const key of PRIVATE_URL_KEYS) {
      assert.equal(source[key], undefined, `${source.id} must not expose ${key}`);
    }
  }
});
