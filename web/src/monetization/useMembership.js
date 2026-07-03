import { useCallback, useEffect, useRef, useState } from 'react';
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
  fetchRefundEligibility,
  requestMembershipRefund,
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
  const [refundEligibility, setRefundEligibility] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundNotice, setRefundNotice] = useState('');

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

  const bootRef = useRef(false);

  useEffect(() => {
    if (MEMBERSHIP_DEV_ACTIVE && !MEMBERSHIP_DEV_EMAIL) return;
    if (bootRef.current) return;
    bootRef.current = true;

    let cancelled = false;

    async function boot() {
      if (MEMBERSHIP_DEV_ACTIVE && MEMBERSHIP_DEV_EMAIL) {
        await verifyToken(getStoredMembershipToken());
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
        const unlocked = Boolean(data.adFree || data.newsletterUnlocked);
        if (unlocked && data.token) {
          applyEntitlement(data.token, data);
          setClaimNotice(
            data.newsletterUnlocked && !data.adFree
              ? 'Newsletter access unlocked on this device.'
              : 'Membership verified on this device.',
          );
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
    setRefundEligibility(null);
    setRefundError('');
    setRefundNotice('');
  }, []);

  const refreshRefundEligibility = useCallback(async (token) => {
    const resolved = String(token || membershipToken || getStoredMembershipToken() || '').trim();
    if (!resolved || MEMBERSHIP_DEV_ACTIVE) {
      setRefundEligibility(null);
      return null;
    }
    try {
      const data = await fetchRefundEligibility(resolved);
      setRefundEligibility(data);
      return data;
    } catch {
      setRefundEligibility(null);
      return null;
    }
  }, [membershipToken]);

  const requestRefund = useCallback(async () => {
    const token = membershipToken || getStoredMembershipToken();
    if (!token) {
      setRefundError('Membership token not found on this device');
      return false;
    }

    setRefundError('');
    setRefundNotice('');
    setRefunding(true);
    try {
      const data = await requestMembershipRefund(token);
      const dollars = ((data.amountCents || 0) / 100).toFixed(2);
      setRefundNotice(
        data.pending
          ? 'Your refund is processing — membership access will end once Stripe completes it.'
          : `Refund of $${dollars} submitted. Membership access has ended on this device.`,
      );
      clearMembership();
      return true;
    } catch (err) {
      setRefundError(err.message || 'Could not request refund');
      return false;
    } finally {
      setRefunding(false);
    }
  }, [clearMembership, membershipToken]);

  useEffect(() => {
    if (!adFree || !membershipToken || MEMBERSHIP_DEV_ACTIVE) {
      setRefundEligibility(null);
      return;
    }
    refreshRefundEligibility(membershipToken);
  }, [adFree, membershipToken, refreshRefundEligibility]);

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
    refundEligibility,
    refunding,
    refundError,
    refundNotice,
    startCheckout,
    claimAdFree,
    clearMembership,
    requestRefund,
    refreshStatus: () => verifyToken(getStoredMembershipToken()),
  };
}
