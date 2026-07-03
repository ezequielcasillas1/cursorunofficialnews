import test from 'node:test';
import assert from 'node:assert/strict';

import { polishSingleHeadlineSections } from './rewrite-email-title.js';

test('polishSingleHeadlineSections leaves multi-headline digests unchanged', async () => {
  const sections = [
    { categoryId: 'changelog', items: [{ id: '1', title: 'A' }] },
    { categoryId: 'blog', items: [{ id: '2', title: 'B' }] },
  ];

  const result = await polishSingleHeadlineSections(sections, {});
  assert.deepEqual(result, sections);
});

test('polishSingleHeadlineSections returns single-section digest when AI is unavailable', async () => {
  const sections = [{ categoryId: 'changelog', items: [{ id: '1', title: 'Raw headline' }] }];

  const result = await polishSingleHeadlineSections(sections, {});
  assert.equal(result[0].items[0].title, 'Raw headline');
});
