const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function sanitizeExternalUrl(url, { stripHash = true } = {}) {
  const value = String(url || '').trim();
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return '';
    if (!parsed.hostname) return '';
    if (parsed.username || parsed.password) return '';

    if (stripHash) {
      parsed.hash = '';
    }

    if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

export function isSafeExternalUrl(url, options) {
  return Boolean(sanitizeExternalUrl(url, options));
}
