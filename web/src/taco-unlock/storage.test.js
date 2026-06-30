import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTacoUnlocked, saveTacoUnlocked } from './storage.js';

const storage = new Map();

test('taco unlock storage round-trip', () => {
  const original = globalThis.localStorage;
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };

  try {
    assert.equal(loadTacoUnlocked(), false);
    saveTacoUnlocked(true);
    assert.equal(loadTacoUnlocked(), true);
    saveTacoUnlocked(false);
    assert.equal(loadTacoUnlocked(), false);
  } finally {
    globalThis.localStorage = original;
    storage.clear();
  }
});
