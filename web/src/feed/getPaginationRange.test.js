import assert from 'node:assert/strict';
import test from 'node:test';
import { getPaginationRange } from './getPaginationRange.js';

test('getPaginationRange returns empty for single page', () => {
  assert.deepEqual(getPaginationRange(1, 1), []);
});

test('getPaginationRange returns all pages when total is small', () => {
  assert.deepEqual(getPaginationRange(2, 5), [1, 2, 3, 4, 5]);
});

test('getPaginationRange inserts ellipsis for large totals', () => {
  assert.deepEqual(getPaginationRange(5, 10), [1, '…', 4, 5, 6, '…', 10]);
});
