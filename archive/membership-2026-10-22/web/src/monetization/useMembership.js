import { useCallback, useEffect, useRef, useState } from 'react';
import { MEMBERSHIP_DEV_ACTIVE } from './config.js';
import {
  clearStoredMembershipToken,
  consumeMembershipClaimTokenFromUrl,
  consumeMembershipSessionIdFromUrl,
  consumeMembershipTokenFromUrl,
  getStoredMembershipToken,
  setStoredMembershipToken,
} from './membershipStorage.js';
import { resolveMembershipClaimChallenge } from './resolveMembershipClaimChallenge.js';
import { resolveCancelReceipt } from './resolveCancelReceipt.js';
import { resolveResumeNotice } from './resolveResumeNotice.js';
import {
  claimMembership,
  confirmMembershipCheckout,
  fetchCancelEligibility,
  fetchMembershipStatus,
  fetchRefundEligibility,
  cancelMembership,
  resumeMembership,
  requestMembershipRefund,
  startMembershipCheckout,
  verifyMembershipClaim,
} from './services/membershipApi.js';

export function useMembership() {
  const [adFree, setAdFree] = useState(false);
  const [newsletterUnlocked, setNewsletterUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [claimCaptcha, setClaimCaptcha] = useState(null);
  const [claimError, setClaimError] = useState('');
  const [claimNotice, setClaimNotice] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [membershipToken, setMembershipToken] = useState('');
  const [refundEligibility, setRefundEligibility] = useState(null);
  const [refunding, setRefunding] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [refundNotice, setRefundNotice] = useState('');
  const [cancelEligibility, setCancelEligibility] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelNotice, setCancelNotice] = useState('');
  const [cancelReceipt, setCancelReceipt] = useState(null);
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeNotice, setResumeNotice] = useState(null);

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
      const resolved = String(token || '').trim();

      if (resolved) {
        setChecking(true);
        try {
          const data = await fetchMembershipStatus(resolved);
          setClaimError('');
          return applyEntitlement(resolved, data);
        } catch {
          setAdFree(false);
          setNewsletterUnlocked(false);
          setMembershipStatus(null);
          setMembershipToken('');
          return false;
        } finally {
          setChecking(false);
        }
      }

      setAdFree(false);
      setNewsletterUnlocked(false);
      setMembershipStatus(null);
      setMembershipToken('');
      setChecking(false);
      return false;
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
    if (bootRef.current) return;
    bootRef.current = true;

    let cancelled = false;

    async function boot() {
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
      setClaimError(
        err.code === 'ALREADY_SUBSCRIBED'
          ? err.message
          : err.message || 'Could not start checkout',
      );
      return false;
    } finally {
      setCheckingOut(false);
    }
  }, []);

  const claimAdFree = useCallback(
    async (email, { turnstileToken } = {}) => {
      setClaimError('');
      setClaimNotice('');
      setClaiming(true);
      try {
        const data = await claimMembership(email, { turnstileToken });
        if (data.token) {
          setStoredMembershipToken(data.token);
        }
        const unlocked = Boolean(data.adFree || data.newsletterUnlocked);
        if (unlocked && data.token) {
          applyEntitlement(data.token, data);
          setClaimCaptcha(null);
          setClaimNotice(
            data.newsletterUnlocked && !data.adFree
              ? 'Newsletter access unlocked on this device.'
              : 'Membership verified on this device.',
          );
          return true;
        }

        setClaimCaptcha(null);
        setClaimNotice(
          data.message || 'Check your email for a one-time verification link to restore your membership.',
        );
        return true;
      } catch (err) {
        const challenge = resolveMembershipClaimChallenge(err);
        if (challenge.captchaRequired) {
          setClaimCaptcha({ siteKey: challenge.siteKey });
          setClaimError(challenge.error);
          return false;
        }
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
    setClaimCaptcha(null);
    setRefundEligibility(null);
    setRefundError('');
    setRefundNotice('');
    setCancelEligibility(null);
    setCancelError('');
    setCancelNotice('');
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

  const refreshCancelEligibility = useCallback(async (token) => {
    const resolved = String(token || membershipToken || getStoredMembershipToken() || '').trim();
    if (!resolved) {
      setCancelEligibility(null);
      return null;
    }
    try {
      const data = await fetchCancelEligibility(resolved);
      setCancelEligibility(data);
      return data;
    } catch (err) {
      setCancelEligibility({
        cancellable: false,
        loadError: true,
        error: err.message || 'Could not load cancellation options',
      });
      return null;
    }
  }, [membershipToken]);

  const cancelActiveMembership = useCallback(async () => {
    const token = membershipToken || getStoredMembershipToken();
    if (!token) {
      setCancelError('Membership token not found on this device');
      return false;
    }

    setCancelError('');
    setCancelNotice('');
    setCancelReceipt(null);
    setResumeError('');
    setResumeNotice(null);
    setCancelling(true);
    try {
      const data = await cancelMembership(token);
      const receipt = resolveCancelReceipt(data);
      setCancelReceipt(receipt);
      setCancelNotice(
        receipt?.summary ||
          (data.immediate
            ? 'Your membership has been cancelled. Newsletter access has ended on this device.'
            : 'Membership cancellation scheduled. You keep access until the end of your billing period.'),
      );
      if (data.immediate) {
        clearMembership();
        return true;
      }

      await refreshCancelEligibility(token);
      return true;
    } catch (err) {
      setCancelError(err.message || 'Could not cancel membership');
      return false;
    } finally {
      setCancelling(false);
    }
  }, [clearMembership, membershipToken, refreshCancelEligibility]);

  const resumeScheduledCancellation = useCallback(async () => {
    const token = membershipToken || getStoredMembershipToken();
    if (!token) {
      setResumeError('Membership token not found on this device');
      return false;
    }

    setResumeError('');
    setResuming(true);
    try {
      const data = await resumeMembership(token);
      setResumeNotice(resolveResumeNotice(data));
      setCancelReceipt(null);
      setCancelNotice('');
      setCancelError('');
      await refreshCancelEligibility(token);
      return true;
    } catch (err) {
      setResumeError(err.message || 'Could not resubscribe');
      return false;
    } finally {
      setResuming(false);
    }
  }, [membershipToken, refreshCancelEligibility]);

  useEffect(() => {
    if (!adFree || !membershipToken || MEMBERSHIP_DEV_ACTIVE) {
      setRefundEligibility(null);
      return;
    }
    refreshRefundEligibility(membershipToken);
  }, [adFree, membershipToken, refreshRefundEligibility]);

  useEffect(() => {
    if (!(adFree || newsletterUnlocked) || !membershipToken) {
      setCancelEligibility(null);
      return;
    }
    refreshCancelEligibility(membershipToken);
  }, [adFree, newsletterUnlocked, membershipToken, refreshCancelEligibility]);

  return {
    adFree,
    newsletterUnlocked,
    checking,
    claiming,
    checkingOut,
    claimCaptchaRequired: Boolean(claimCaptcha),
    claimCaptchaSiteKey: claimCaptcha?.siteKey || '',
    claimError,
    claimNotice,
    memberEmail,
    membershipStatus,
    membershipToken,
    refundEligibility,
    refunding,
    refundError,
    refundNotice,
    cancelEligibility,
    cancelling,
    cancelError,
    cancelNotice,
    cancelReceipt,
    resuming,
    resumeError,
    resumeNotice,
    startCheckout,
    claimAdFree,
    clearMembership,
    requestRefund,
    cancelActiveMembership,
    resumeScheduledCancellation,
    refreshCancelEligibility,
    refreshStatus: () => verifyToken(getStoredMembershipToken()),
  };
}
