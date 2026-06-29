const TOKEN_KEY = 'cain_adfree_token';

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

export function getStoredAdFreeToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setStoredAdFreeToken(token) {
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

export function clearStoredAdFreeToken() {
  setStoredAdFreeToken('');
}

/** Read ?adfree_token= from URL (e.g. post-subscribe redirect) and persist it. */
export function consumeAdFreeTokenFromUrl() {
  const token = consumeUrlToken('adfree_token');
  if (token) {
    setStoredAdFreeToken(token);
  }
  return token;
}

/** Read ?adfree_claim_token= from URL and return it for one-time verification. */
export function consumeMembershipClaimTokenFromUrl() {
  return consumeUrlToken('adfree_claim_token');
}
