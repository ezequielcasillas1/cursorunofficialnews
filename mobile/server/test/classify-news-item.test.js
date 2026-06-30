import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyNewsItem } from '../src/classify/classify-news-item.js';

test('forum.cursor.com URLs always classify as forum (unless issue-promotable)', () => {
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

test('stackoverflow and github discussions classify correctly', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'stackoverflow-cursor-ide',
      title: 'Working with multi-repo workspaces',
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
    'discussion',
  );
});

test('dev.to imperative how-tos stay tutorial', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'devto-cursor-tutorials',
      title: 'Catch MCP Tool Catalog Drift Before Your Agent Ships Broken Integrations',
      excerpt: 'Step-by-step guide for monitoring MCP tool lists in CI.',
      canonicalUrl: 'https://dev.to/someone/mcp-drift',
    }),
    'tutorial',
  );
});

test('dev.to opinion/roundup classifies as discussion', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'devto-cursor-tutorials',
      title: 'The Juejin AI Coding Roundups Have Stopped Converging on Winners',
      excerpt:
        'I went down a rabbit hole this morning reading five Juejin AI coding roundups.',
      canonicalUrl: 'https://dev.to/someone/juejin-roundups',
    }),
    'discussion',
  );
});

test('medium "Why X Is..." think-pieces classify as discussion', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'medium-cursor-tutorials',
      title: 'Why AI Is Replacing Code Reviews Faster Than Anyone Expected',
      excerpt:
        'A timeline that was supposed to take a decade collapsed into a single product cycle.',
      canonicalUrl: 'https://medium.com/some/code-review-piece',
    }),
    'discussion',
  );
});

test('bug/error forum posts promote to issue', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'forum-cursor-tips',
      title: 'Account usage gone update cursor to 3.9.16',
      excerpt: 'account usage percentage left has gone missing after update cursor to 3.9.16',
      canonicalUrl: 'https://forum.cursor.com/t/account-usage-gone/999',
    }),
    'issue',
  );

  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-forum-general',
      title: 'Why does cursor uninstall from my laptop every few days?',
      excerpt: 'cursor keeps uninstalling itself. The only resolution is install cursor again.',
      canonicalUrl: 'https://forum.cursor.com/t/uninstall/777',
    }),
    'issue',
  );

  assert.equal(
    classifyNewsItem({
      sourceId: 'forum-cursor-guides',
      title: 'Remote Control not working for me',
      excerpt: 'handed-off sessions from my mac desktop app never appear on my phone',
      canonicalUrl: 'https://forum.cursor.com/t/remote-control/555',
    }),
    'issue',
  );
});

test('Reddit rants about broken behavior promote to issue', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'reddit-cursor',
      title: 'Why is Cursor forcing the Agent interface on startup? The new Glass mode breaks custom workflows.',
      excerpt: 'It is really frustrating that they are now pushing this empty Agent chat interface.',
      canonicalUrl: 'https://www.reddit.com/r/cursor/comments/xyz/forcing-agent/',
    }),
    'issue',
  );
});

test('forum opinion threads promote to discussion', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-forum-general',
      title: 'Are We Underestimating Database Setup Friction?',
      excerpt:
        'I have been experimenting with VibeCode DB and it made me think about how much time we spend on database setup.',
      canonicalUrl: 'https://forum.cursor.com/t/db-friction/123',
    }),
    'discussion',
  );
});

test('non-opinion forum support posts stay forum', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-forum-general',
      title: 'How do I reset my billing cycle?',
      excerpt: 'I need help updating my subscription before the next charge.',
      canonicalUrl: 'https://forum.cursor.com/t/billing-reset/456',
    }),
    'forum',
  );
});

test('cursor-forum-general support questions stay forum (not issue)', () => {
  assert.equal(
    classifyNewsItem({
      sourceId: 'cursor-forum-general',
      title: 'Privacy and the forced "how did the agent do"',
      excerpt: 'I don\'t want the "how did the agent do" popups.',
      canonicalUrl: 'https://forum.cursor.com/t/privacy-agent-feedback/777',
    }),
    'forum',
  );
});
