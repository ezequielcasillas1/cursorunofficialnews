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

export const MEMBERSHIP_REQUIRED_MESSAGE =
  'An active membership is required to unlock the email newsletter.';

function syncablePrefs(prefs) {
  return {
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

/**
 * @param {{ newsletterUnlocked?: boolean, memberEmail?: string, membershipToken?: string }} membership
 *   Entitlement from `useMembership()` — the newsletter is membership-gated (see
 *   `web/worker/src/notifications/email-routes.js`), so every subscribe/resubscribe
 *   call must carry `membershipToken`; the server re-derives the email server-side.
 */
export function useNewsletter(membership = {}) {
  const { newsletterUnlocked = false, memberEmail = '', membershipToken = '' } = membership;

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

  // Newsletter email always mirrors the verified membership email — the server
  // ignores any other value, so keep the display in sync once membership loads.
  useEffect(() => {
    if (newsletterUnlocked && memberEmail && prefs.email !== memberEmail) {
      persistPrefs({ ...prefs, email: memberEmail });
    }
  }, [newsletterUnlocked, memberEmail, prefs, persistPrefs]);

  const syncToServer = useCallback(
    async (nextPrefs) => {
      if (!newsletterUnlocked) {
        throw new Error(MEMBERSHIP_REQUIRED_MESSAGE);
      }

      const clean = syncablePrefs(nextPrefs);
      if (clean.enabled && clean.categories.length === 0) {
        throw new Error('Select at least one topic for the email digest.');
      }

      const response = await subscribeNewsletter({
        categories: clean.enabled ? clean.categories : [],
        categoryLimits: clean.enabled ? clean.categoryLimits : {},
        enabled: clean.enabled,
        resendVerification: clean.pendingVerification,
        membershipToken,
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
    },
    [newsletterUnlocked, membershipToken],
  );

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
      const next = { ...prefs, enabled };
      return runSync(next, { syncServer: newsletterUnlocked });
    },
    [prefs, runSync, newsletterUnlocked],
  );

  const subscribe = useCallback(async () => {
    const next = { ...prefs, enabled: true };
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
    toggleCategory,
    setCategoryLimit,
    setEnabled,
    subscribe,
    unsubscribe,
  };
}
