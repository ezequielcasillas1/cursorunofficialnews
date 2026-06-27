/** Dev: Vite proxies /api → http://127.0.0.1:8787 (see vite.config.js) */
export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

/** Sent as X-API-Secret on POST /v1/ingest when set in mobile/server/.env */
export const INGEST_SECRET = import.meta.env.VITE_INGEST_SECRET || '';

export const APP_NAME = 'Unofficial Cursor News';

export const DISCLAIMER =
  'Not affiliated with, endorsed by, or sponsored by Anysphere, Inc. "Cursor" is a trademark of its respective owner.';
