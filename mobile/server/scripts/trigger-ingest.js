/**
 * Production / cron helper — POST /v1/ingest with X-API-Secret from env or .env.
 * Use when INGEST_CRON_ENABLED=false and an external scheduler runs this script.
 */
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

function loadEnvFile() {
  try {
    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[trigger-ingest] Could not read ${envPath}:`, err.message);
    }
  }
}

loadEnvFile();

const port = process.env.PORT || '8787';
const base = (process.env.PUBLIC_API_BASE || `http://127.0.0.1:${port}`).replace(/\/$/, '');
const secret = process.env.INGEST_SECRET?.trim();
const url = `${base}/v1/ingest`;

const headers = { 'Content-Type': 'application/json' };
if (secret) {
  headers['X-API-Secret'] = secret;
}

try {
  const res = await fetch(url, { method: 'POST', headers, body: '{}' });
  const text = await res.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = text;
  }

  if (!res.ok) {
    console.error(`[trigger-ingest] HTTP ${res.status}`, payload);
    process.exit(1);
  }

  console.log('[trigger-ingest] OK', JSON.stringify(payload));
} catch (err) {
  console.error('[trigger-ingest]', err.message || err);
  process.exit(1);
}
