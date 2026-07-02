const PROD_ORIGIN_DEFAULTS = [
  'https://cursorunofficial.news',
  'https://www.cursorunofficial.news',
];

const DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

function normalizeOrigin(origin) {
  const value = String(origin || '').trim();
  if (!value) return '';

  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

function envOrigins(env) {
  return String(env?.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

export function getAllowedCorsOrigins(env) {
  const allowed = new Set(PROD_ORIGIN_DEFAULTS.map((origin) => normalizeOrigin(origin)));

  const publicWebBase = normalizeOrigin(env?.PUBLIC_WEB_BASE);
  if (publicWebBase) {
    allowed.add(publicWebBase);
  }

  for (const origin of envOrigins(env)) {
    allowed.add(origin);
  }

  if (env?.ENVIRONMENT !== 'production') {
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
    allowed.add('http://localhost:4173');
    allowed.add('http://127.0.0.1:4173');
  }

  return [...allowed];
}

export function isAllowedCorsOrigin(origin, env) {
  if (!origin) return false;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  if (getAllowedCorsOrigins(env).includes(normalized)) {
    return true;
  }

  return env?.ENVIRONMENT !== 'production' && DEV_ORIGIN_RE.test(normalized);
}

/** Origin resolver matching Hono's `cors({ origin })` function signature: (origin, c) => ... */
export function resolveCorsOrigin(origin, c) {
  return isAllowedCorsOrigin(origin, c.env) ? origin : null;
}
