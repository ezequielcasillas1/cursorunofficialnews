const TOKEN_KEY = 'cain_adfree_token';

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
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('adfree_token')?.trim();
    if (!token) return '';

    setStoredAdFreeToken(token);
    params.delete('adfree_token');
    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
    return token;
  } catch {
    return '';
  }
}
