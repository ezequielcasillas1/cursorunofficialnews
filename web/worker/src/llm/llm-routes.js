import { requireIngestSecret } from '../middleware/require-api-secret.js';
import {
  chatCompletion,
  getWorkersAiConfig,
  isWorkersAiConfigured,
  pingWorkersAi,
  summarizeNewsExcerpt,
} from './workers-ai-client.js';

export function registerLlmRoutes(app) {
  app.get('/v1/llm/status', async (c) => {
    const status = await pingWorkersAi(c.env);
    return c.json(status);
  });

  app.post('/v1/llm/chat', requireIngestSecret, async (c) => {
    if (!isWorkersAiConfigured(c.env)) {
      return c.json({ error: 'Workers AI not configured — add the `ai` binding in wrangler.jsonc' }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const { messages, model, temperature, maxTokens } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'messages array is required' }, 400);
    }

    try {
      const result = await chatCompletion({ messages, model, temperature, maxTokens }, c.env);
      return c.json({ ok: true, ...result });
    } catch (err) {
      console.error('[POST /v1/llm/chat]', err);
      return c.json({ error: err.message || 'Workers AI request failed' }, 502);
    }
  });

  app.post('/v1/llm/summarize', requireIngestSecret, async (c) => {
    if (!isWorkersAiConfigured(c.env)) {
      return c.json({ error: 'Workers AI not configured — add the `ai` binding in wrangler.jsonc' }, 503);
    }

    const body = await c.req.json().catch(() => ({}));
    const { title, rawExcerpt, maxChars } = body || {};
    if (!title && !rawExcerpt) {
      return c.json({ error: 'title or rawExcerpt is required' }, 400);
    }

    try {
      const excerpt = await summarizeNewsExcerpt({ title, rawExcerpt, maxChars }, c.env);
      return c.json({ ok: true, excerpt, model: getWorkersAiConfig(c.env).model });
    } catch (err) {
      console.error('[POST /v1/llm/summarize]', err);
      return c.json({ error: err.message || 'Summarize failed' }, 502);
    }
  });
}
