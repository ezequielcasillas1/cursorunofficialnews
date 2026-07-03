const API_BASE = '/api/v1/admin';
const ADMIN_SECRET = import.meta.env.VITE_LOCAL_ADMIN_SECRET || '';

async function adminFetch(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    'X-Local-Admin-Secret': ADMIN_SECRET,
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

export function getSummary() {
  return adminFetch('/summary');
}

export function getMembers() {
  return adminFetch('/members');
}

export function scanIntruders({ dryRun = false } = {}) {
  return adminFetch('/intruders/scan', {
    method: 'POST',
    body: JSON.stringify({ dryRun }),
  });
}

export function setOverride({ email, overrideStatus, reason }) {
  return adminFetch('/overrides', {
    method: 'POST',
    body: JSON.stringify({ email, overrideStatus, reason }),
  });
}

export function clearOverride(email) {
  return adminFetch(`/overrides/${encodeURIComponent(email)}`, { method: 'DELETE' });
}

export function getAudit(limit = 50) {
  return adminFetch(`/audit?limit=${limit}`);
}

export function hasAdminSecret() {
  return Boolean(ADMIN_SECRET?.trim());
}
