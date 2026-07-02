import Constants from 'expo-constants';
import { Platform } from 'react-native';

function trimTrailingSlash(url) {
  return String(url).replace(/\/$/, '');
}

function isAndroidEmulator() {
  if (Constants.isDevice === false) return true;
  const model = (Platform.constants?.Model || '').toLowerCase();
  const fingerprint = (Platform.constants?.Fingerprint || '').toLowerCase();
  return (
    model.includes('sdk') ||
    model.includes('emulator') ||
    fingerprint.includes('generic') ||
    fingerprint.includes('sdk')
  );
}

function resolveDefaultApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);

  const configured = Constants.expoConfig?.extra?.apiBase;
  if (configured) return trimTrailingSlash(configured);

  // The API is served under /api by the Cloudflare Worker (web/worker/) in
  // both local `wrangler dev` and production — Fly.io's bare /v1/* host is
  // retired, so local defaults must include the /api prefix too.
  if (Platform.OS === 'android') {
    // 10.0.2.2 reaches the host only on the Android emulator.
    if (isAndroidEmulator()) return 'http://10.0.2.2:8787/api';
    // Physical device: localhost works with `adb reverse tcp:8787 tcp:8787`.
    // Otherwise set EXPO_PUBLIC_API_BASE to your PC LAN IP (see env/mobile.example.env).
    return 'http://127.0.0.1:8787/api';
  }

  return 'http://127.0.0.1:8787/api';
}

export const API_BASE = resolveDefaultApiBase();

export const DISCLAIMER =
  'Unofficial fan project. Not affiliated with Anysphere or Cursor.';

export {
  FEED_CATEGORIES,
  getCategoryApiParam,
  getEmptyFeedMessage,
  OFFICIAL_ONLY_TOOLTIP,
} from '../../shared/feed/feedCategories.js';
export { FEED_PAGE_SIZE } from '../../shared/feed/feedPagination.js';
