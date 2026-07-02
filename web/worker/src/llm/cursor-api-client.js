import {
  buildCursorModelSelection,
  getCursorApiConfig,
  isCursorApiConfigured,
} from './cursor-api-config.js';
import {
  buildNewsletterHtmlPrompt,
  stripMarkdownHtmlFences,
} from '../notifications/newsletter-prompt.js';

export { isCursorApiConfigured };

const TERMINAL_STATUSES = new Set(['FINISHED', 'ERROR', 'CANCELLED', 'EXPIRED']);

async function parseErrorBody(response) {
  const text = await response.text().catch(() => '');
  return text.slice(0, 300) || response.statusText || 'Request failed';
}

async function cursorRequest(path, { method = 'GET', body, config } = {}) {
  const { baseUrl, apiKey, timeoutMs } = config;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Cursor API ${method} ${path} ${response.status}: ${await parseErrorBody(response)}`);
  }

  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function archiveAgent(agentId, config) {
  try {
    await cursorRequest(`/v1/agents/${agentId}/archive`, { method: 'POST', body: {}, config });
  } catch (err) {
    console.warn('[cursor-api] archive agent failed:', err.message || err);
  }
}

/**
 * Run a one-shot cloud agent prompt (no repo) and return assistant text.
 */
export async function runCursorPrompt({ promptText, modelId } = {}, env) {
  if (!isCursorApiConfigured(env)) {
    throw new Error('CURSOR_API_KEY not configured');
  }

  if (!promptText?.trim()) {
    throw new Error('promptText is required');
  }

  const config = getCursorApiConfig(env);
  const model = buildCursorModelSelection(modelId, env);

  const created = await cursorRequest('/v1/agents', {
    method: 'POST',
    body: {
      prompt: { text: promptText },
      model,
    },
    config,
  });

  const agentId = created?.agent?.id;
  const runId = created?.run?.id;
  if (!agentId || !runId) {
    throw new Error('Cursor API did not return agent/run ids');
  }

  const deadline = Date.now() + config.timeoutMs;

  try {
    while (Date.now() < deadline) {
      const run = await cursorRequest(`/v1/agents/${agentId}/runs/${runId}`, { config });

      if (TERMINAL_STATUSES.has(run.status)) {
        if (run.status === 'FINISHED') {
          const content = stripMarkdownHtmlFences(run.result || '');
          if (!content) {
            throw new Error('Cursor run finished with empty result');
          }
          return {
            content,
            model: model.id,
            runId,
            agentId,
            durationMs: run.durationMs ?? null,
          };
        }

        throw new Error(`Cursor run ${run.status}${run.result ? `: ${run.result.slice(0, 200)}` : ''}`);
      }

      await sleep(config.pollIntervalMs);
    }

    throw new Error(`Cursor run timed out after ${config.timeoutMs}ms`);
  } finally {
    await archiveAgent(agentId, config);
  }
}

export async function generateNewsletterHtml(
  {
    email,
    unsubscribeUrl,
    matchingNewItems,
    matchingRecentItems,
    modelId,
    promptText,
  } = {},
  env,
) {
  const text =
    promptText ||
    buildNewsletterHtmlPrompt({
      email,
      unsubscribeUrl,
      matchingNewItems,
      matchingRecentItems,
    });

  const result = await runCursorPrompt({ promptText: text, modelId }, env);
  return { html: result.content, model: result.model, runId: result.runId };
}
