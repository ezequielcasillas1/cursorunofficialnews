import { getLmStudioConfig, isLmStudioConfigured } from './config.js';

export { isLmStudioConfigured };

function authHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

async function parseErrorBody(response) {
  const text = await response.text().catch(() => '');
  return text.slice(0, 200) || response.statusText || 'Request failed';
}

export async function listModels() {
  const { baseUrl, apiKey, timeoutMs } = getLmStudioConfig();
  const response = await fetch(`${baseUrl}/models`, {
    headers: authHeaders(apiKey),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`LM Studio models ${response.status}: ${await parseErrorBody(response)}`);
  }

  const payload = await response.json();
  return payload.data || payload.models || [];
}

export async function chatCompletion({
  messages,
  model,
  temperature = 0.3,
  maxTokens = 512,
} = {}) {
  if (!isLmStudioConfigured()) {
    throw new Error('LM_STUDIO_MODEL not configured');
  }

  const config = getLmStudioConfig();
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: authHeaders(config.apiKey),
    body: JSON.stringify({
      model: model || config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`LM Studio chat ${response.status}: ${await parseErrorBody(response)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('LM Studio returned no message content');
  }

  return {
    content: content.trim(),
    model: payload.model || model || config.model,
    usage: payload.usage || null,
  };
}

export async function pingLmStudio() {
  if (!isLmStudioConfigured()) {
    return { ok: false, configured: false, error: 'LM_STUDIO_MODEL not set' };
  }

  const config = getLmStudioConfig();
  try {
    const models = await listModels();
    const ids = models.map((m) => m.id || m.name).filter(Boolean);
    const modelLoaded = ids.some(
      (id) => id === config.model || id.includes(config.model),
    );

    return {
      ok: true,
      configured: true,
      baseUrl: config.baseUrl,
      model: config.model,
      availableModels: ids.slice(0, 20),
      modelLoaded: modelLoaded || ids.length > 0,
    };
  } catch (err) {
    return {
      ok: false,
      configured: true,
      baseUrl: config.baseUrl,
      model: config.model,
      error: err.message || String(err),
    };
  }
}

const SUMMARIZE_SYSTEM = `You write short news excerpts for an unofficial Cursor fan feed.
Output one plain-text excerpt only, no markdown. Max 280 characters. No quotes around the text.`;

export async function summarizeNewsExcerpt({ title, rawExcerpt, maxChars = 280 } = {}) {
  const source = [title, rawExcerpt].filter(Boolean).join('\n\n').trim();
  if (!source) return null;

  const { content } = await chatCompletion({
    messages: [
      { role: 'system', content: SUMMARIZE_SYSTEM },
      {
        role: 'user',
        content: `Summarize for the feed (max ${maxChars} chars):\n\n${source.slice(0, 4000)}`,
      },
    ],
    maxTokens: 160,
    temperature: 0.2,
  });

  if (content.length <= maxChars) return content;
  return `${content.slice(0, maxChars - 1).trimEnd()}…`;
}
