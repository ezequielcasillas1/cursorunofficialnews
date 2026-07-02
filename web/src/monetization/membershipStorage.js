const TOKEN_KEY = 'cain_membership_token';

function consumeUrlToken(paramName) {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get(paramName)?.trim();
    if (!token) return '';

    params.delete(paramName);
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
    return token;
  } catch {
    return '';
  }
}

export function getStoredMembershipToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setStoredMembershipToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.)
  }
}

export function clearStoredMembershipToken() {
  setStoredMembershipToken('');
}

/** Read ?membership_token= from URL (e.g. magic-link activation) and persist it. */
export function consumeMembershipTokenFromUrl() {
  const token = consumeUrlToken('membership_token');
  if (token) {
    setStoredMembershipToken(token);
  }
  return token;
}

/** Read ?membership_claim_token= from URL and return it for one-time verification. */
export function consumeMembershipClaimTokenFromUrl() {
  return consumeUrlToken('membership_claim_token');
}

/** Read ?membership_session_id= from URL (Stripe Checkout success redirect). */
export function consumeMembershipSessionIdFromUrl() {
  return consumeUrlToken('membership_session_id');
}
