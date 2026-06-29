import { useCallback, useEffect, useState } from 'react';
import { BMC_DEV_ADFREE } from './config.js';
import {
  clearStoredAdFreeToken,
  consumeAdFreeTokenFromUrl,
  consumeMembershipClaimTokenFromUrl,
  getStoredAdFreeToken,
  setStoredAdFreeToken,
} from './membershipStorage.js';
import {
  claimMembership,
  fetchMembershipStatus,
  verifyMembershipClaim,
} from './services/membershipApi.js';

export function useMembership() {
  const [adFree, setAdFree] = useState(BMC_DEV_ADFREE);
  const [checking, setChecking] = useState(!BMC_DEV_ADFREE);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimNotice, setClaimNotice] = useState('');
  const [supporterEmail, setSupporterEmail] = useState('');
  const [membershipStatus, setMembershipStatus] = useState(null);

  const verifyToken = useCallback(async (token) => {
    if (BMC_DEV_ADFREE) {
      setAdFree(true);
      setChecking(false);
      return true;
    }

    if (!token) {
      setAdFree(false);
      setMembershipStatus(null);
      setChecking(false);
      return false;
    }

    setChecking(true);
    try {
      const data = await fetchMembershipStatus(token);
      const active = Boolean(data.adFree);
      setClaimError('');
      setAdFree(active);
      setSupporterEmail(data.email || '');
      setMembershipStatus(data.membershipStatus || null);
      if (!active) {
        clearStoredAdFreeToken();
      }
      return active;
    } catch {
      setAdFree(false);
      setMembershipStatus(null);
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  const verifyClaimToken = useCallback(async (token) => {
    if (!token) return false;

    setChecking(true);
    try {
      setClaimError('');
      const data = await verifyMembershipClaim(token);
      if (data.token) {
        setStoredAdFreeToken(data.token);
      }
      setAdFree(Boolean(data.adFree));
      setSupporterEmail(data.email || '');
      setMembershipStatus(data.membershipStatus || (data.adFree ? 'active' : null));
      setClaimNotice(data.adFree ? 'Membership verified. Ads are now hidden on this browser.' : '');
      return Boolean(data.adFree);
    } catch (err) {
      setClaimError(err.message || 'Could not verify membership link');
      return false;
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (BMC_DEV_ADFREE) return;

    let cancelled = false;

    async function boot() {
      const claimToken = consumeMembershipClaimTokenFromUrl();
      if (claimToken) {
        const ok = await verifyClaimToken(claimToken);
        if (ok || cancelled) return;
      }

      const urlToken = consumeAdFreeTokenFromUrl();
      const token = urlToken || getStoredAdFreeToken();
      if (!cancelled) {
        await verifyToken(token);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [verifyClaimToken, verifyToken]);

  const claimAdFree = useCallback(
    async (email) => {
      setClaimError('');
      setClaimNotice('');
      setClaiming(true);
      try {
        const data = await claimMembership(email);
        if (data.token) {
          setStoredAdFreeToken(data.token);
        }
        if (data.adFree) {
          setAdFree(true);
          setSupporterEmail(data.email || email);
          setMembershipStatus(data.membershipStatus || 'active');
          return true;
        }

        setClaimNotice(
          data.message || 'Check your email for a one-time verification link to hide ads.',
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
    [],
  );

  const clearAdFree = useCallback(() => {
    clearStoredAdFreeToken();
    setAdFree(false);
    setSupporterEmail('');
    setMembershipStatus(null);
    setClaimError('');
    setClaimNotice('');
  }, []);

  return {
    adFree,
    checking,
    claiming,
    claimError,
    claimNotice,
    supporterEmail,
    membershipStatus,
    claimAdFree,
    clearAdFree,
    refreshStatus: () => verifyToken(getStoredAdFreeToken()),
  };
}
