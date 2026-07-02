import { useCallback, useEffect, useState } from 'react';
import { MEMBERSHIP_DEV_ACTIVE, MEMBERSHIP_DEV_EMAIL } from './config.js';
import {
  clearStoredMembershipToken,
  consumeMembershipClaimTokenFromUrl,
  consumeMembershipSessionIdFromUrl,
  consumeMembershipTokenFromUrl,
  getStoredMembershipToken,
  setStoredMembershipToken,
} from './membershipStorage.js';
import {
  claimMembership,
  confirmMembershipCheckout,
  fetchMembershipStatus,
  startMembershipCheckout,
  verifyMembershipClaim,
} from './services/membershipApi.js';

export function useMembership() {
  const [adFree, setAdFree] = useState(MEMBERSHIP_DEV_ACTIVE);
  const [newsletterUnlocked, setNewsletterUnlocked] = useState(MEMBERSHIP_DEV_ACTIVE);
  const [checking, setChecking] = useState(!MEMBERSHIP_DEV_ACTIVE);
  const [claiming, setClaiming] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimNotice, setClaimNotice] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipToken, setMembershipToken] = useState('');

  const applyEntitlement = useCallback((token, data) => {
    const active = Boolean(data.adFree);
    const newsletter = Boolean(data.newsletterUnlocked ?? active);
    setAdFree(active);
    setNewsletterUnlocked(newsletter);
    setMemberEmail(data.email || '');
    setMembershipStatus(data.membershipStatus || (active ? 'active' : newsletter ? 'newsletter_free' : null));
    const resolvedToken = data.token || token;
    if (newsletter && resolvedToken) {
      setMembershipToken(resolvedToken);
      setStoredMembershipToken(resolvedToken);
    } else if (!active) {
      clearStoredMembershipToken();
      setMembershipToken('');
    }
    return active || newsletter;
  }, []);

  const verifyToken = useCallback(
    async (token) => {
      if (MEMBERSHIP_DEV_ACTIVE) {
        if (MEMBERSHIP_DEV_EMAIL) {
          setChecking(true);
          try {
            const data = await claimMembership(MEMBERSHIP_DEV_EMAIL);
            if (data.token) {
              applyEntitlement(data.token, data);
              setChecking(false);
              return true;
            }
          } catch {
            // Fall back to client-side dev unlock below.
          } finally {
            setChecking(false);
          }
        }

        setAdFree(true);
        setNewsletterUnlocked(true);
        setChecking(false);
        return true;
      }

      if (!token) {
        setAdFree(false);
        setNewsletterUnlocked(false);
        setMembershipStatus(null);
        setMembershipToken('');
        setChecking(false);
        return false;
      }

      setChecking(true);
      try {
        const data = await fetchMembershipStatus(token);
        setClaimError('');
        return applyEntitlement(token, data);
      } catch {
        setAdFree(false);
        setNewsletterUnlocked(false);
        setMembershipStatus(null);
        setMembershipToken('');
        return false;
      } finally {
        setChecking(false);
      }
    },
    [applyEntitlement],
  );

  const verifyClaimToken = useCallback(
    async (token) => {
      if (!token) return false;

      setChecking(true);
      try {
        setClaimError('');
        const data = await verifyMembershipClaim(token);
        if (data.token) {
          setStoredMembershipToken(data.token);
        }
        const active = applyEntitlement(data.token, data);
        setClaimNotice(active ? 'Membership verified on this device.' : '');
        return active;
      } catch (err) {
        setClaimError(err.message || 'Could not verify membership link');
        return false;
      } finally {
        setChecking(false);
      }
    },
    [applyEntitlement],
  );

  const confirmCheckoutSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return false;

      setChecking(true);
      try {
        setClaimError('');
        const data = await confirmMembershipCheckout(sessionId);
        if (data.token) {
          setStoredMembershipToken(data.token);
        }
        const active = applyEntitlement(data.token, data);
        setClaimNotice(active ? 'Membership activated — thank you for joining!' : '');
        return active;
      } catch (err) {
        setClaimError(err.message || 'Could not confirm your membership checkout.');
        return false;
      } finally {
        setChecking(false);
      }
    },
    [applyEntitlement],
  );

  useEffect(() => {
    if (MEMBERSHIP_DEV_ACTIVE && !MEMBERSHIP_DEV_EMAIL) return;

    let cancelled = false;

    async function boot() {
      if (MEMBERSHIP_DEV_ACTIVE && MEMBERSHIP_DEV_EMAIL) {
        const ok = await verifyToken(getStoredMembershipToken());
        if (ok || cancelled) return;
        await verifyToken('');
        return;
      }

      const sessionId = consumeMembershipSessionIdFromUrl();
      if (sessionId) {
        const ok = await confirmCheckoutSession(sessionId);
        if (ok || cancelled) return;
      }

      const claimToken = consumeMembershipClaimTokenFromUrl();
      if (claimToken) {
        const ok = await verifyClaimToken(claimToken);
        if (ok || cancelled) return;
      }

      const urlToken = consumeMembershipTokenFromUrl();
      const token = urlToken || getStoredMembershipToken();
      if (!cancelled) {
        await verifyToken(token);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [confirmCheckoutSession, verifyClaimToken, verifyToken]);

  const startCheckout = useCallback(async (amount, email) => {
    setClaimError('');
    setCheckingOut(true);
    try {
      const data = await startMembershipCheckout(amount, email);
      if (data.url) {
        window.location.href = data.url;
        return true;
      }
      setClaimError('Could not start checkout — please try again.');
      return false;
    } catch (err) {
      setClaimError(err.message || 'Could not start checkout');
      return false;
    } finally {
      setCheckingOut(false);
    }
  }, []);

  const claimAdFree = useCallback(
    async (email) => {
      setClaimError('');
      setClaimNotice('');
      setClaiming(true);
      try {
        const data = await claimMembership(email);
        if (data.token) {
          setStoredMembershipToken(data.token);
        }
        if (data.adFree) {
          applyEntitlement(data.token, data);
          return true;
        }

        setClaimNotice(
          data.message || 'Check your email for a one-time verification link to restore your membership.',
        );
        return true;
      } catch (err) {
        setClaimError(err.message || 'Could not verify membership');
        setMembershipStatus(err.membershipStatus || null);
        return false;
      } finally {
        setClaiming(false);
      }
    },
    [applyEntitlement],
  );

  const clearMembership = useCallback(() => {
    clearStoredMembershipToken();
    setAdFree(false);
    setNewsletterUnlocked(false);
    setMemberEmail('');
    setMembershipStatus(null);
    setMembershipToken('');
    setClaimError('');
    setClaimNotice('');
  }, []);

  return {
    adFree,
    newsletterUnlocked,
    checking,
    claiming,
    checkingOut,
    claimError,
    claimNotice,
    memberEmail,
    membershipStatus,
    membershipToken,
    startCheckout,
    claimAdFree,
    clearMembership,
    refreshStatus: () => verifyToken(getStoredMembershipToken()),
  };
}
