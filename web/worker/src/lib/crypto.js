/**
 * Web Crypto helpers — Workers has no `node:crypto`. Replaces
 * crypto.randomBytes / crypto.createHmac / crypto.timingSafeEqual usage.
 */

function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cryptographically secure random hex token (default 32 bytes = 64 hex chars). */
export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** Constant-time string compare — avoids timing side-channels on secret checks. */
export function timingSafeEqualStrings(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(String(a ?? ''));
  const bBytes = enc.encode(String(b ?? ''));
  if (aBytes.length !== bBytes.length) return false;
  if (typeof crypto.subtle.timingSafeEqual === 'function') {
    return crypto.subtle.timingSafeEqual(aBytes, bBytes);
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

/** HMAC-SHA256 hex digest. `data` may be a string or an ArrayBuffer/Uint8Array (raw webhook body). */
export async function hmacSha256Hex(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret ?? '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const messageBytes = typeof data === 'string' ? enc.encode(data) : data;
  const signature = await crypto.subtle.sign('HMAC', key, messageBytes);
  return toHex(new Uint8Array(signature));
}
