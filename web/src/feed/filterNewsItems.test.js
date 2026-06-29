import assert from 'node:assert/strict';
import test from 'node:test';
import { filterNewsItems } from './filterNewsItems.js';

const sampleItems = [
  {
    id: '1',
    title: 'Cursor 1.0 Release',
    excerpt: 'Major IDE update with new agent features.',
    category: 'release',
    sourceName: 'Cursor Changelog',
    attributionLabel: 'Cursor Changelog',
  },
  {
    id: '2',
    title: 'Community tips for MCP',
    excerpt: 'How to wire up custom tools.',
    category: 'forum',
    sourceName: 'Cursor Forum',
    attributionLabel: 'Cursor Forum',
  },
];

test('filterNewsItems returns all items when query is empty', () => {
  assert.deepEqual(filterNewsItems(sampleItems, ''), sampleItems);
  assert.deepEqual(filterNewsItems(sampleItems, '   '), sampleItems);
});

test('filterNewsItems matches title, excerpt, category label, and source', () => {
  assert.equal(filterNewsItems(sampleItems, 'agent').length, 1);
  assert.equal(filterNewsItems(sampleItems, 'changelog')[0].id, '1');
  assert.equal(filterNewsItems(sampleItems, 'forum')[0].id, '2');
  assert.equal(filterNewsItems(sampleItems, 'MCP')[0].id, '2');
});

test('filterNewsItems is case-insensitive', () => {
  assert.equal(filterNewsItems(sampleItems, 'CURSOR').length, 2);
});
