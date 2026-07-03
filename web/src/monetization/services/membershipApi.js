import { API_BASE } from '../../config.js';

const REQUEST_TIMEOUT_MS = 15000;

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json', ...options.headers },
      signal: controller.signal,
      ...options,
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Membership API returned an unexpected response');
    }

    const body = await res.json();
    if (!res.ok) {
      const err = new Error(body.error || `Request failed (${res.status})`);
      if (body.membershipStatus) {
        err.membershipStatus = body.membershipStatus;
      }
      throw err;
    }
    return body;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Membership check timed out — is the API running?');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Creates a Stripe Checkout Session for the given monthly tier; caller redirects to `url`. */
export function startMembershipCheckout(amount, email) {
  return fetchJson('/v1/membership/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, email: email || undefined }),
  });
}

/** Confirms a completed Stripe Checkout Session (post-redirect) and returns the membership token. */
export function confirmMembershipCheckout(sessionId) {
  const params = new URLSearchParams({ session_id: sessionId });
  return fetchJson(`/v1/membership/checkout/confirm?${params.toString()}`);
}

export function claimMembership(email) {
  return fetchJson('/v1/membership/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export function fetchMembershipStatus(token) {
  const params = new URLSearchParams({ token });
  return fetchJson(`/v1/membership/status?${params.toString()}`);
}

export function verifyMembershipClaim(token) {
  return fetchJson('/v1/membership/claim/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

export function fetchRefundEligibility(token) {
  const params = new URLSearchParams({ token });
  return fetchJson(`/v1/membership/refund/eligibility?${params.toString()}`);
}

export function requestMembershipRefund(membershipToken) {
  return fetchJson('/v1/membership/refund', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ membershipToken }),
  });
}

export function fetchCancelEligibility(token) {
  const params = new URLSearchParams({ token });
  return fetchJson(`/v1/membership/cancel/eligibility?${params.toString()}`);
}

export function cancelMembership(membershipToken) {
  return fetchJson('/v1/membership/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ membershipToken }),
  });
}
