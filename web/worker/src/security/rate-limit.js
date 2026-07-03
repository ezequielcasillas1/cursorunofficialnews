/** Soft in-isolate rate limit — resets on Worker recycle; good enough to blunt abuse bursts. */

const buckets = new Map();

export function checkRateLimit(key, windowMs) {
  if (!key) return true;
  const now = Date.now();
  const last = buckets.get(key);
  if (last && now - last < windowMs) {
    return false;
  }
  buckets.set(key, now);
  return true;
}

export function clearRateLimit(key) {
  if (key) buckets.delete(key);
}

export function clientIp(c) {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return c.req.header('cf-connecting-ip') || 'unknown';
}

export function clientRateKey(c, suffix = '') {
  const ip = clientIp(c);
  return suffix ? `${ip}:${suffix}` : ip;
}
