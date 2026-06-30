import assert from 'node:assert/strict';
import test from 'node:test';

async function withEnv(overrides, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return await fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('buildNewsletterHtmlPrompt includes subscriber and items', async () => {
  const { buildNewsletterHtmlPrompt } = await import('../src/notifications/newsletter-prompt.js');
  const prompt = buildNewsletterHtmlPrompt({
    email: 'reader@example.com',
    unsubscribeUrl: 'https://example.com/unsub',
    matchingNewItems: [{ title: 'New story' }],
    matchingRecentItems: [{ title: 'Recent story' }],
  });

  assert.match(prompt, /reader@example.com/);
  assert.match(prompt, /https:\/\/example.com\/unsub/);
  assert.match(prompt, /New story/);
  assert.match(prompt, /Recent story/);
  assert.match(prompt, /Output ONLY valid HTML/);
});

test('stripMarkdownHtmlFences removes fenced html blocks', async () => {
  const { stripMarkdownHtmlFences } = await import('../src/notifications/newsletter-prompt.js');
  const html = '<html><body>Hello</body></html>';
  assert.equal(stripMarkdownHtmlFences(`\`\`\`html\n${html}\n\`\`\``), html);
  assert.equal(stripMarkdownHtmlFences(html), html);
});

test('buildCursorModelSelection defaults to composer-2.5 fast', async () => {
  await withEnv(
    { CURSOR_NEWSLETTER_MODEL: undefined, CURSOR_NEWSLETTER_FAST: undefined },
    async () => {
      const { buildCursorModelSelection } = await import('../src/llm/cursor-api-config.js');
      assert.deepEqual(buildCursorModelSelection(), {
        id: 'composer-2.5',
        params: [{ id: 'fast', value: 'true' }],
      });
    },
  );
});

test('runCursorPrompt polls until FINISHED and archives agent', async () => {
  await withEnv(
    {
      CURSOR_API_KEY: 'cursor_test_key',
      CURSOR_NEWSLETTER_POLL_MS: '1',
      CURSOR_NEWSLETTER_TIMEOUT_MS: '5000',
    },
    async () => {
      const calls = [];
      const originalFetch = global.fetch;

      global.fetch = async (url, options = {}) => {
        calls.push({ url: String(url), method: options.method || 'GET' });

        if (String(url).endsWith('/v1/agents') && options.method === 'POST') {
          return new Response(
            JSON.stringify({
              agent: { id: 'bc-test-agent' },
              run: { id: 'run-test-1', status: 'CREATING' },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        if (String(url).includes('/runs/run-test-1')) {
          return new Response(
            JSON.stringify({
              id: 'run-test-1',
              agentId: 'bc-test-agent',
              status: 'FINISHED',
              result: '<html><body>Digest</body></html>',
              durationMs: 1200,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        if (String(url).endsWith('/archive')) {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response('not found', { status: 404 });
      };

      try {
        const { runCursorPrompt } = await import('../src/llm/cursor-api-client.js');
        const result = await runCursorPrompt({ promptText: 'Write HTML newsletter' });

        assert.equal(result.content, '<html><body>Digest</body></html>');
        assert.equal(result.model, 'composer-2.5');
        assert.equal(result.runId, 'run-test-1');
        assert.ok(calls.some((call) => call.url.includes('/archive')));
        assert.equal(
          calls.find((call) => call.method === 'POST' && call.url.endsWith('/v1/agents'))?.method,
          'POST',
        );
      } finally {
        global.fetch = originalFetch;
      }
    },
  );
});

test('isCursorApiConfigured reflects CURSOR_API_KEY', async () => {
  await withEnv({ CURSOR_API_KEY: undefined }, async () => {
    const { isCursorApiConfigured } = await import('../src/llm/cursor-api-config.js');
    assert.equal(isCursorApiConfigured(), false);
  });

  await withEnv({ CURSOR_API_KEY: 'cursor_test_key' }, async () => {
    const { isCursorApiConfigured } = await import('../src/llm/cursor-api-config.js');
    assert.equal(isCursorApiConfigured(), true);
  });
});
