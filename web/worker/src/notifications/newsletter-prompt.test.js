import test from 'node:test';
import assert from 'node:assert/strict';

import { buildNewsletterHtmlPrompt } from './newsletter-prompt.js';

const digestSections = [
  {
    categoryId: 'changelog',
    items: [{ id: '1', title: 'Cursor 2.0', category: 'changelog' }],
  },
  {
    categoryId: 'blog',
    items: [{ id: '2', title: 'New blog post', category: 'blog' }],
  },
];

test('buildNewsletterHtmlPrompt prefers digestSections over flat arrays', () => {
  const prompt = buildNewsletterHtmlPrompt({
    email: 'user@example.com',
    unsubscribeUrl: 'https://example.com/u',
    digestSections,
    matchingNewItems: [{ id: 'x', title: 'ignored' }],
    matchingRecentItems: [{ id: 'y', title: 'ignored' }],
  });

  assert.match(prompt, /"categoryId":"changelog"/);
  assert.match(prompt, /"categoryId":"blog"/);
  assert.doesNotMatch(prompt, /"title":"ignored"/);
});

test('buildNewsletterHtmlPrompt includes officialOnly in subscriber metadata', () => {
  const prompt = buildNewsletterHtmlPrompt({
    email: 'user@example.com',
    officialOnly: true,
    subscriber: { categories: ['changelog'], categoryLimits: { changelog: 2 } },
    digestSections,
  });

  assert.match(prompt, /"officialOnly":true/);
  assert.match(prompt, /"categories":\["changelog"\]/);
});
