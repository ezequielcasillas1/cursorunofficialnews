import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveTheme } from './resolveTheme.js';

test('resolveTheme returns saved dark or light preference', () => {
  assert.equal(resolveTheme('dark'), 'dark');
  assert.equal(resolveTheme('light'), 'light');
});

test('resolveTheme defaults to dark when no saved preference', () => {
  assert.equal(resolveTheme(null), 'dark');
  assert.equal(resolveTheme(undefined), 'dark');
  assert.equal(resolveTheme('invalid'), 'dark');
});
