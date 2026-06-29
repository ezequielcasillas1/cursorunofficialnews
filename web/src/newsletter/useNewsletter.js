import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_NEWSLETTER_PREFS,
  normalizeNewsletterPrefs,
} from './config.js';
import { loadNewsletterPrefs, saveNewsletterPrefs } from './storage.js';
import {
  fetchNewsletterStatus,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from './services/newsletterApi.js';

export function isValidNewsletterEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || normalized.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

function syncablePrefs(prefs) {
  return {
    email: String(prefs.email || '').trim().toLowerCase(),
    categories: Array.isArray(prefs.categories) ? prefs.categories : [],
    enabled: Boolean(prefs.enabled),
    manageToken: String(prefs.manageToken || '').trim(),
  };
}

function mergeSubscriber(basePrefs, subscriber, manageToken) {
  return normalizeNewsletterPrefs({
    ...basePrefs,
    email: subscriber?.email || basePrefs.email,
    categories: Array.isArray(subscriber?.categories)
      ? subscriber.categories
      : basePrefs.categories,
    enabled:
      typeof subscriber?.enabled === 'boolean'
        ? subscriber.enabled
        : basePrefs.enabled,
    manageToken: manageToken ?? basePrefs.manageToken,
  });
}

export function useNewsletter() {
  const [prefs, setPrefs] = useState({ ...DEFAULT_NEWSLETTER_PREFS });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const persistPrefs = useCallback((nextPrefs) => {
    const normalized = normalizeNewsletterPrefs(nextPrefs);
    setPrefs(normalized);
    saveNewsletterPrefs(normalized);
    return normalized;
  }, []);

  const syncToServer = useCallback(async (nextPrefs) => {
    const clean = syncablePrefs(nextPrefs);
    if (!isValidNewsletterEmail(clean.email)) {
      throw new Error('Enter a valid email address.');
    }
    if (clean.enabled && clean.categories.length === 0) {
      throw new Error('Select at least one topic for the email digest.');
    }

    const response = await subscribeNewsletter({
      email: clean.email,
      categories: clean.enabled ? clean.categories : [],
      enabled: clean.enabled,
    });

    return mergeSubscriber(
      nextPrefs,
      response?.subscriber,
      response?.subscriber?.manageToken || clean.manageToken,
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    const initial = loadNewsletterPrefs();
    persistPrefs(initial);

    async function boot() {
      if (!initial.manageToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      setSyncing(true);
      try {
        const data = await fetchNewsletterStatus(initial.manageToken);
        if (cancelled) return;

        if (data.subscribed && data.subscriber) {
          persistPrefs(mergeSubscriber(initial, data.subscriber, initial.manageToken));
          setStatusMessage('Loaded saved email digest settings.');
        } else {
          persistPrefs({
            ...initial,
            enabled: false,
            manageToken: '',
          });
          setStatusMessage(
            'No active email digest is linked to this browser yet. Subscribe to enable it.',
          );
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err.message || 'Could not load newsletter settings.');
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setLoading(false);
        }
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [persistPrefs]);

  const runSync = useCallback(
    async (nextPrefs, { syncServer = false, unsubscribe = false } = {}) => {
      const previous = prefs;
      const normalized = persistPrefs(nextPrefs);
      setErrorMessage('');
      setStatusMessage('');

      if (!syncServer && !unsubscribe) {
        if (!normalized.enabled) {
          setStatusMessage('Email digest paused.');
        }
        return normalized;
      }

      setSyncing(true);
      try {
        if (unsubscribe) {
          if (!normalized.manageToken) {
            throw new Error(
              'This browser needs a fresh secure manage token. Subscribe once here, or use the unsubscribe link from a digest email.',
            );
          }
          await unsubscribeNewsletter(normalized.manageToken);
          const cleared = persistPrefs({
            ...normalized,
            enabled: false,
            manageToken: '',
          });
          setStatusMessage('Unsubscribed — no more digest emails.');
          return cleared;
        }

        const synced = await syncToServer(normalized);
        persistPrefs(synced);
        setStatusMessage(
          synced.enabled
            ? 'Subscribed — one digest email when new headlines arrive.'
            : 'Email digest paused.',
        );
        return synced;
      } catch (err) {
        persistPrefs(previous);
        setErrorMessage(err.message || 'Failed to save newsletter settings.');
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [persistPrefs, prefs, syncToServer],
  );

  const setEmail = useCallback(
    (email) => {
      const next = persistPrefs({ ...prefs, email });
      setErrorMessage('');
      setStatusMessage('');
      return next;
    },
    [persistPrefs, prefs],
  );

  const toggleCategory = useCallback(
    async (categoryId) => {
      const set = new Set(prefs.categories);
      if (set.has(categoryId)) set.delete(categoryId);
      else set.add(categoryId);
      const next = {
        ...prefs,
        categories: [...set],
      };

      const shouldSync = next.enabled && isValidNewsletterEmail(next.email);
      return runSync(next, { syncServer: shouldSync });
    },
    [prefs, runSync],
  );

  const setEnabled = useCallback(
    async (enabled) => {
      const next = {
        ...prefs,
        enabled,
      };
      const shouldSync = isValidNewsletterEmail(next.email);
      return runSync(next, { syncServer: shouldSync });
    },
    [prefs, runSync],
  );

  const subscribe = useCallback(async () => {
    const next = {
      ...prefs,
      enabled: true,
    };
    return runSync(next, { syncServer: true });
  }, [prefs, runSync]);

  const unsubscribe = useCallback(async () => {
    return runSync(prefs, { unsubscribe: true });
  }, [prefs, runSync]);

  return {
    prefs,
    loading,
    syncing,
    statusMessage,
    errorMessage,
    setEmail,
    toggleCategory,
    setEnabled,
    subscribe,
    unsubscribe,
  };
}
