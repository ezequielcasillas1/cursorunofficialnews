const DEFAULT_BASE_URL = 'https://api.cursor.com';
const DEFAULT_MODEL = 'composer-2.5';
const DEFAULT_TIMEOUT_MS = 180_000;
const DEFAULT_POLL_MS = 2_000;

export function getCursorApiConfig() {
  const baseUrl = (process.env.CURSOR_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '');
  const apiKey = process.env.CURSOR_API_KEY?.trim() || '';
  const model = process.env.CURSOR_NEWSLETTER_MODEL?.trim() || DEFAULT_MODEL;
  const timeoutMs = Number(process.env.CURSOR_NEWSLETTER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
  const pollIntervalMs = Number(process.env.CURSOR_NEWSLETTER_POLL_MS) || DEFAULT_POLL_MS;

  return {
    baseUrl,
    apiKey,
    model,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    pollIntervalMs: Number.isFinite(pollIntervalMs) && pollIntervalMs > 0 ? pollIntervalMs : DEFAULT_POLL_MS,
  };
}

export function isCursorApiConfigured() {
  return Boolean(getCursorApiConfig().apiKey);
}

export function buildCursorModelSelection(modelId) {
  const model = modelId || getCursorApiConfig().model;
  const useFast = process.env.CURSOR_NEWSLETTER_FAST?.trim().toLowerCase() !== 'false';

  if (!useFast) {
    return { id: model };
  }

  return {
    id: model,
    params: [{ id: 'fast', value: 'true' }],
  };
}
