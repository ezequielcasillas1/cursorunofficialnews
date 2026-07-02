const DEFAULT_BASE_URL = 'https://api.cursor.com';
const DEFAULT_MODEL = 'composer-2.5';
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_POLL_MS = 2_000;

export function getCursorApiConfig(env) {
  const baseUrl = (env?.CURSOR_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
  const apiKey = env?.CURSOR_API_KEY?.trim() || '';
  const model = env?.CURSOR_NEWSLETTER_MODEL?.trim() || DEFAULT_MODEL;
  const timeoutMs = Number(env?.CURSOR_NEWSLETTER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = Number(env?.CURSOR_NEWSLETTER_POLL_MS) || DEFAULT_POLL_MS;

  return {
    baseUrl,
    apiKey,
    model,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    pollIntervalMs: Number.isFinite(pollIntervalMs) && pollIntervalMs > 0 ? pollIntervalMs : DEFAULT_POLL_MS,
  };
}

export function isCursorApiConfigured(env) {
  return Boolean(getCursorApiConfig(env).apiKey);
}

export function buildCursorModelSelection(modelId, env) {
  const model = modelId || getCursorApiConfig(env).model;
  const useFast = env?.CURSOR_NEWSLETTER_FAST?.trim().toLowerCase() !== 'false';

  if (!useFast) {
    return { id: model };
  }

  return {
    id: model,
    params: [{ id: 'fast', value: 'true' }],
  };
}
