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

function envOrigins() {
  return String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

export function getAllowedCorsOrigins() {
  const allowed = new Set(PROD_ORIGIN_DEFAULTS.map((origin) => normalizeOrigin(origin)));

  const publicWebBase = normalizeOrigin(process.env.PUBLIC_WEB_BASE);
  if (publicWebBase) {
    allowed.add(publicWebBase);
  }

  for (const origin of envOrigins()) {
    allowed.add(origin);
  }

  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
    allowed.add('http://localhost:4173');
    allowed.add('http://127.0.0.1:4173');
  }

  return [...allowed];
}

export function isAllowedCorsOrigin(origin) {
  if (!origin) return false;

  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;

  if (getAllowedCorsOrigins().includes(normalized)) {
    return true;
  }

  return process.env.NODE_ENV !== 'production' && DEV_ORIGIN_RE.test(normalized);
}

export function createCorsOptions() {
  return {
    methods: ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type', 'X-API-Secret'],
    maxAge: 600,
    origin(origin, callback) {
      if (!origin) {
        callback(null, false);
        return;
      }
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  };
}
