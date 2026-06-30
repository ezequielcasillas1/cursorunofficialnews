const DEFAULT_BASE_URL = 'http://127.0.0.1:1234/v1';
const DEFAULT_API_KEY = 'lm-studio';
const DEFAULT_TIMEOUT_MS = 120_000;

export function getLmStudioConfig() {
  const baseUrl = (
    process.env.LM_STUDIO_BASE_URL?.trim() || DEFAULT_BASE_URL
  ).replace(/\/$/, '');
  const model = process.env.LM_STUDIO_MODEL?.trim() || '';
  const apiKey = process.env.LM_STUDIO_API_KEY?.trim() || DEFAULT_API_KEY;
  const timeoutMs = Number(process.env.LM_STUDIO_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;

  return {
    baseUrl,
    model,
    apiKey,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
  };
}

/** True when LM_STUDIO_MODEL is set — required for chat/summarize calls. */
export function isLmStudioConfigured() {
  return Boolean(getLmStudioConfig().model);
}
