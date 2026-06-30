import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_NEWSLETTER_PREFS,
  NEWSLETTER_CATEGORY_LIMIT,
  normalizeNewsletterPrefs,
} from './config.js';
import {
  consumeNewsletterVerifyTokenFromUrl,
  loadNewsletterPrefs,
  saveNewsletterPrefs,
} from './storage.js';
import {
  fetchNewsletterStatus,
  subscribeNewsletter,
  unsubscribeNewsletter,
  verifyNewsletterSubscription,
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
    categoryLimits: prefs.categoryLimits || {},
    enabled: Boolean(prefs.enabled),
    manageToken: String(prefs.manageToken || '').trim(),
    pendingVerification: Boolean(prefs.pendingVerification),
  };
}

function mergeSubscriber(basePrefs, subscriber, manageToken) {
  const categories = Array.isArray(subscriber?.categories)
    ? subscriber.categories
    : basePrefs.categories;

  return normalizeNewsletterPrefs({
    ...basePrefs,
    email: subscriber?.email || basePrefs.email,
    categories,
    categoryLimits: subscriber?.categoryLimits || basePrefs.categoryLimits,
    enabled:
      typeof subscriber?.enabled === 'boolean'
        ? subscriber.enabled
        : basePrefs.enabled,
    manageToken: manageToken ?? basePrefs.manageToken,
    pendingVerification: Boolean(subscriber?.pending),
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
      categoryLimits: clean.enabled ? clean.categoryLimits : {},
      enabled: clean.enabled,
    });

    if (response?.pending) {
      return normalizeNewsletterPrefs({
        ...nextPrefs,
        enabled: false,
        pendingVerification: true,
        manageToken: '',
      });
    }

    return mergeSubscriber(
      nextPrefs,
      response?.subscriber,
      response?.subscriber?.manageToken || clean.manageToken,
    );
  }, []);

  const verifyFromUrlToken = useCallback(
    async (verifyToken, basePrefs) => {
      setSyncing(true);
      setErrorMessage('');
      setStatusMessage('');
      try {
        const data = await verifyNewsletterSubscription(verifyToken);
        const synced = mergeSubscriber(
          basePrefs,
          data?.subscriber,
          data?.subscriber?.manageToken,
        );
        const confirmed = persistPrefs({
          ...synced,
          enabled: true,
          pendingVerification: false,
        });
        setStatusMessage(
          'Subscription confirmed — one digest email when new headlines arrive.',
        );
        return confirmed;
      } catch (err) {
        setErrorMessage(err.message || 'Could not confirm subscription link.');
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [persistPrefs],
  );

  useEffect(() => {
    let cancelled = false;
    const initial = loadNewsletterPrefs();
    persistPrefs(initial);

    async function boot() {
      const verifyToken = consumeNewsletterVerifyTokenFromUrl();
      if (verifyToken) {
        try {
          await verifyFromUrlToken(verifyToken, initial);
        } catch {
          /* surfaced via errorMessage */
        }
        if (!cancelled) setLoading(false);
        return;
      }

      if (!initial.manageToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      setSyncing(true);
      try {
        const data = await fetchNewsletterStatus(initial.manageToken);
        if (cancelled) return;

        if (data.pending) {
          persistPrefs({
            ...initial,
            enabled: false,
            pendingVerification: true,
          });
          setStatusMessage(
            'Check your email to confirm your subscription before digests start.',
          );
        } else if (data.subscribed && data.subscriber) {
          persistPrefs(mergeSubscriber(initial, data.subscriber, initial.manageToken));
          setStatusMessage('Loaded saved email digest settings.');
        } else {
          persistPrefs({
            ...initial,
            enabled: false,
            pendingVerification: false,
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
  }, [persistPrefs, verifyFromUrlToken]);

  const runSync = useCallback(
    async (nextPrefs, { syncServer = false, unsubscribe = false } = {}) => {
      const normalized = persistPrefs(nextPrefs);
      setErrorMessage('');
      setStatusMessage('');

      if (!syncServer && !unsubscribe) {
        if (normalized.pendingVerification) {
          setStatusMessage('Check your email to confirm your subscription.');
        } else if (!normalized.enabled) {
          setStatusMessage('Email digest paused.');
        }
        return normalized;
      }

      setSyncing(true);
      try {
        if (unsubscribe) {
          if (!normalized.manageToken) {
            throw new Error(
              'Could not update settings from this browser. Subscribe again here, or use the Unsubscribe link in any digest email you have received.',
            );
          }
          await unsubscribeNewsletter(normalized.manageToken);
          const cleared = persistPrefs({
            ...normalized,
            enabled: false,
            pendingVerification: false,
            manageToken: '',
          });
          setStatusMessage('Unsubscribed — no more digest emails.');
          return cleared;
        }

        const synced = await syncToServer(normalized);
        persistPrefs(synced);
        if (synced.pendingVerification) {
          setStatusMessage('Check your email to confirm your subscription.');
        } else {
          setStatusMessage(
            synced.enabled
              ? 'Subscribed — one digest email when new headlines arrive.'
              : 'Email digest paused.',
          );
        }
        return synced;
      } catch (err) {
        setErrorMessage(err.message || 'Failed to save newsletter settings.');
        throw err;
      } finally {
        setSyncing(false);
      }
    },
    [persistPrefs, syncToServer],
  );

  const setEmail = useCallback(
    (email) => {
      const next = persistPrefs({
        ...prefs,
        email,
        pendingVerification: false,
      });
      setErrorMessage('');
      setStatusMessage('');
      return next;
    },
    [persistPrefs, prefs],
  );

  const toggleCategory = useCallback(
    (categoryId) => {
      const set = new Set(prefs.categories);
      const nextLimits = { ...prefs.categoryLimits };
      if (set.has(categoryId)) {
        set.delete(categoryId);
        delete nextLimits[categoryId];
      } else {
        set.add(categoryId);
        nextLimits[categoryId] = nextLimits[categoryId] || NEWSLETTER_CATEGORY_LIMIT.default;
      }
      const next = normalizeNewsletterPrefs({
        ...prefs,
        categories: [...set],
        categoryLimits: nextLimits,
      });
      persistPrefs(next);
      setErrorMessage('');
      setStatusMessage('');
      return next;
    },
    [persistPrefs, prefs],
  );

  const setCategoryLimit = useCallback(
    (categoryId, value) => {
      if (!prefs.categories.includes(categoryId)) return prefs;
      const next = normalizeNewsletterPrefs({
        ...prefs,
        categoryLimits: {
          ...prefs.categoryLimits,
          [categoryId]: value,
        },
      });
      persistPrefs(next);
      setErrorMessage('');
      setStatusMessage('');
      return next;
    },
    [persistPrefs, prefs],
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
    setCategoryLimit,
    setEnabled,
    subscribe,
    unsubscribe,
  };
}
