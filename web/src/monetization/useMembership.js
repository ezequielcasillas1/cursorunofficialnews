import { useCallback, useEffect, useState } from 'react';
import { BMC_DEV_ADFREE } from './config.js';
import {
  clearStoredAdFreeToken,
  consumeAdFreeTokenFromUrl,
  getStoredAdFreeToken,
  setStoredAdFreeToken,
} from './membershipStorage.js';
import { claimMembership, fetchMembershipStatus } from './services/membershipApi.js';

export function useMembership() {
  const [adFree, setAdFree] = useState(BMC_DEV_ADFREE);
  const [checking, setChecking] = useState(!BMC_DEV_ADFREE);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');
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

  useEffect(() => {
    if (BMC_DEV_ADFREE) return;

    const urlToken = consumeAdFreeTokenFromUrl();
    const token = urlToken || getStoredAdFreeToken();
    verifyToken(token);
  }, [verifyToken]);

  const claimAdFree = useCallback(
    async (email) => {
      setClaimError('');
      setClaiming(true);
      try {
        const data = await claimMembership(email);
        if (data.token) {
          setStoredAdFreeToken(data.token);
        }
        setAdFree(Boolean(data.adFree));
        setSupporterEmail(data.email || email);
        setMembershipStatus(data.membershipStatus || (data.adFree ? 'active' : null));
        return Boolean(data.adFree);
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
  }, []);

  return {
    adFree,
    checking,
    claiming,
    claimError,
    supporterEmail,
    membershipStatus,
    claimAdFree,
    clearAdFree,
    refreshStatus: () => verifyToken(getStoredAdFreeToken()),
  };
}
