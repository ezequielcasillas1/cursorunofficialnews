import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSourcesHidden, saveSourcesHidden } from './storage.js';

const storage = new Map();

test('source visibility storage round-trip', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };

  try {
    assert.equal(loadSourcesHidden(), false);
    saveSourcesHidden(true);
    assert.equal(loadSourcesHidden(), true);
    saveSourcesHidden(false);
    assert.equal(loadSourcesHidden(), false);
  } finally {
    globalThis.localStorage = original;
    storage.clear();
  }
});
