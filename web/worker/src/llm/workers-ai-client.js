/**
 * Workers AI client — replaces llm/lm-studio-client.js. LM Studio ran on
 * http://127.0.0.1:1234 (your machine), which Cloudflare Workers cannot
 * reach; this uses the `AI` binding (env.AI) instead, so summarization keeps
 * working once deployed.
 */

const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct';
const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_MAX_TOKENS = 512;

export function getWorkersAiConfig(env) {
  return {
    model: env?.WORKERS_AI_MODEL?.trim() || DEFAULT_MODEL,
  };
}

/** Workers AI has no API key — "configured" just means the binding is present. */
export function isWorkersAiConfigured(env) {
  return Boolean(env?.AI);
}

export async function pingWorkersAi(env) {
  if (!isWorkersAiConfigured(env)) {
    return { ok: false, configured: false, reason: 'AI binding not present' };
  }
  return { ok: true, configured: true, model: getWorkersAiConfig(env).model };
}

export async function chatCompletion({ messages, model, temperature, maxTokens }, env) {
  if (!isWorkersAiConfigured(env)) {
    throw new Error('Workers AI binding not configured');
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages array is required');
  }

  const resolvedModel = model || getWorkersAiConfig(env).model;
  const result = await env.AI.run(resolvedModel, {
    messages,
    temperature: temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
  });

  const content = result?.response ?? result?.result?.response ?? '';
  return { content, model: resolvedModel };
}

export async function summarizeNewsExcerpt({ title, rawExcerpt, maxChars }, env) {
  const limit = Number(maxChars) > 0 ? Number(maxChars) : 300;
  const { content } = await chatCompletion(
    {
      messages: [
        {
          role: 'system',
          content: `Summarize Cursor AI news items in one concise, factual sentence under ${limit} characters. No markdown, no preamble — output only the summary.`,
        },
        {
          role: 'user',
          content: `Title: ${title || ''}\n\nContent: ${rawExcerpt || ''}`,
        },
      ],
      maxTokens: 200,
    },
    env,
  );

  return String(content || '').trim().slice(0, limit);
}
