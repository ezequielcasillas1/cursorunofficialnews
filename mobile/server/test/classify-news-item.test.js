import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyNewsItem } from '../src/classify/classify-news-item.js';

test('forum.cursor.com URLs always classify as forum', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'forum-cursor-how-to',
      category: 'tutorial',
      title: 'Does the 10-referral cap stay monthly if I switch to annual billing?',
      excerpt: 'I am on monthly Pro and hit the referral cap.',
      canonicalUrl: 'https://forum.cursor.com/t/referral-cap/12345',
    }),
    'forum',
  );

  assert.equal(
    classifyNewsItem({
      sourceId: 'forum-cursor-guides',
      category: 'tutorial',
      title: 'Remote Control not working for me',
      excerpt: 'Handed-off sessions never appear on my phone.',
      canonicalUrl: 'https://forum.cursor.com/t/remote-control/999',
    }),
    'forum',
  );
});

test('official docs and learn URLs stay tutorial', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-docs-guides',
      title: 'Agent mode',
      canonicalUrl: 'https://cursor.com/docs/agent/overview',
    }),
    'tutorial',
  );

  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-learn-tutorials',
      title: 'Intro to Cursor',
      canonicalUrl: 'https://cursor.com/learn/intro',
    }),
    'tutorial',
  );
});

test('stackoverflow and github discussions classify as community', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'stackoverflow-cursor-ide',
      title: 'How do I disable agent popups?',
      canonicalUrl: 'https://stackoverflow.com/questions/123/cursor-agent',
    }),
    'community',
  );

  assert.equal(
    classifyNewsItem({
      sourceId: 'github-cursor-discussions',
      title: 'Feature request: respect editor mode',
      canonicalUrl: 'https://github.com/getcursor/cursor/discussions/456',
    }),
    'community',
  );
});

test('dev.to tutorial titles stay tutorial; questions become community', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'devto-cursor-tutorials',
      title: 'How to Catch MCP Tool Catalog Drift Before Your Agent Ships',
      excerpt: 'Step-by-step guide for monitoring MCP tool lists in CI.',
      canonicalUrl: 'https://dev.to/someone/mcp-drift',
    }),
    'tutorial',
  );

  assert.equal(
    classifyNewsItem({
      sourceId: 'devto-cursor-tutorials',
      title: 'The Juejin AI Coding Roundups Have Stopped Converging on Winners',
      excerpt: 'Opinion piece on scoring frameworks in AI tool reviews.',
      canonicalUrl: 'https://dev.to/someone/juejin-roundups',
    }),
    'community',
  );
});

test('forum support posts from general feed stay forum', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-forum-general',
      title: 'Privacy and the forced how did the agent do',
      excerpt: 'Question for Cursor about chat transcript training.',
      canonicalUrl: 'https://forum.cursor.com/t/privacy-agent-feedback/777',
    }),
    'forum',
  );
});
