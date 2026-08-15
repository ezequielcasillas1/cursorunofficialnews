import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryFromUrl } from './url-rules.js';

test('url rules map xAI / SpaceX hosts to spacexai', () => {
  assert.equal(categoryFromUrl('https://x.ai/news/introducing-grok-4-6'), 'spacexai');
  assert.equal(categoryFromUrl('https://www.spacex.com/updates'), 'spacexai');
  assert.equal(categoryFromUrl('https://spacenews.com/tag/spacex/starship/'), 'spacexai');
  assert.equal(categoryFromUrl('https://news.google.com/rss/articles/abc'), null);
  assert.equal(
    categoryFromUrl('https://github.com/xai-org/grok-build/releases/tag/v1'),
    'spacexai',
  );
});

test('url rules keep official video and social on their tabs', () => {
  assert.equal(categoryFromUrl('https://www.youtube.com/watch?v=abc'), 'video');
  assert.equal(categoryFromUrl('https://x.com/SpaceXAI/status/1'), 'social');
});
