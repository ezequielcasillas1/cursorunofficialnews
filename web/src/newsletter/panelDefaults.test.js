import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NEWSLETTER_PANEL_DEFAULT_EXPANDED } from './config.js';

test('newsletter panel defaults to collapsed on page load', () => {
  assert.equal(NEWSLETTER_PANEL_DEFAULT_EXPANDED, false);
});
