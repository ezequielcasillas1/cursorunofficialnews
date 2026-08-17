/** Count-based limiter — never hard-blocks. Isolate-local; resets on Worker recycle. */

const buckets = new Map();

export function peekAttemptCount(key) {
  if (!key) return 0;
  return buckets.get(key)?.count || 0;
}

export function recordAttempt(key) {
  if (!key) return 1;
  const existing = buckets.get(key);
  if (!existing) {
    buckets.set(key, { count: 1 });
    return 1;
  }
  existing.count += 1;
  return existing.count;
}

export function clearAttempts(key) {
  if (key) buckets.delete(key);
}

export function resetAllAttempts() {
  buckets.clear();
}
