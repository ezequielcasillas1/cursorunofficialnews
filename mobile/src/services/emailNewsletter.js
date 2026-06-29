import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../config/constants';
import { DEFAULT_NOTIFICATION_PREFS } from '../config/notifications';

export const EMAIL_PREFS_KEY = '@cursor_news_email_prefs';

export const DEFAULT_EMAIL_PREFS = {
  enabled: false,
  email: '',
  categories: DEFAULT_NOTIFICATION_PREFS.categories,
  manageToken: '',
};

const REQUEST_TIMEOUT_MS = 15000;

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return body;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out — check API at ${API_BASE}`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function loadEmailPrefs() {
  try {
    const raw = await AsyncStorage.getItem(EMAIL_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_EMAIL_PREFS,
        ...parsed,
        categories: Array.isArray(parsed.categories)
          ? parsed.categories
          : DEFAULT_EMAIL_PREFS.categories,
        manageToken:
          typeof parsed.manageToken === 'string'
            ? parsed.manageToken
            : DEFAULT_EMAIL_PREFS.manageToken,
      };
    }
  } catch {
    /* corrupt prefs */
  }
  return { ...DEFAULT_EMAIL_PREFS };
}

export async function saveEmailPrefs(prefs) {
  await AsyncStorage.setItem(EMAIL_PREFS_KEY, JSON.stringify(prefs));
}

export function isValidEmailFormat(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function subscribeEmail({ email, categories, enabled = true }) {
  return fetchJson('/v1/email/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, categories, enabled }),
  });
}

export function unsubscribeEmail(token) {
  return fetchJson('/v1/email/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

export function fetchEmailStatus(token) {
  const params = new URLSearchParams({ token: String(token || '').trim() });
  return fetchJson(`/v1/email/status?${params}`);
}

export function toggleEmailCategory(categories, categoryId) {
  const set = new Set(categories);
  if (set.has(categoryId)) set.delete(categoryId);
  else set.add(categoryId);
  return [...set];
}
