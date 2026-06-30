import { requireIngestSecret } from '../middleware/require-api-secret.js';
import {
  chatCompletion,
  isLmStudioConfigured,
  pingLmStudio,
  summarizeNewsExcerpt,
} from './lm-studio-client.js';
import { getLmStudioConfig } from './config.js';

export function registerLlmRoutes(app) {
  app.get('/v1/llm/status', async (_req, res) => {
    const status = await pingLmStudio();
    res.json(status);
  });

  app.post('/v1/llm/chat', requireIngestSecret, async (req, res) => {
    if (!isLmStudioConfigured()) {
      res.status(503).json({ error: 'LM Studio not configured — set LM_STUDIO_MODEL' });
      return;
    }

    const { messages, model, temperature, maxTokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    try {
      const result = await chatCompletion({ messages, model, temperature, maxTokens });
      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('[POST /v1/llm/chat]', err);
      res.status(502).json({ error: err.message || 'LM Studio request failed' });
    }
  });

  app.post('/v1/llm/summarize', requireIngestSecret, async (req, res) => {
    if (!isLmStudioConfigured()) {
      res.status(503).json({ error: 'LM Studio not configured — set LM_STUDIO_MODEL' });
      return;
    }

    const { title, rawExcerpt, maxChars } = req.body || {};
    if (!title && !rawExcerpt) {
      res.status(400).json({ error: 'title or rawExcerpt is required' });
      return;
    }

    try {
      const excerpt = await summarizeNewsExcerpt({ title, rawExcerpt, maxChars });
      res.json({ ok: true, excerpt, model: getLmStudioConfig().model });
    } catch (err) {
      console.error('[POST /v1/llm/summarize]', err);
      res.status(502).json({ error: err.message || 'Summarize failed' });
    }
  });
}
