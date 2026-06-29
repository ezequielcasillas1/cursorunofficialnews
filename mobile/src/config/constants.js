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

  if (Platform.OS === 'android') {
    // 10.0.2.2 reaches the host only on the Android emulator.
    if (isAndroidEmulator()) return 'http://10.0.2.2:8787';
    // Physical device: localhost works with `adb reverse tcp:8787 tcp:8787`.
    // Otherwise set EXPO_PUBLIC_API_BASE to your PC LAN IP (see mobile/.env.example).
    return 'http://127.0.0.1:8787';
  }

  return 'http://127.0.0.1:8787';
}

export const API_BASE = resolveDefaultApiBase();

export const DISCLAIMER =
  'Unofficial fan project. Not affiliated with Anysphere or Cursor.';

/** User-facing feed tabs → registry categories for GET /v1/news?category= */
export const FEED_CATEGORIES = [
  { id: 'all', label: 'All', apiCategories: null },
  { id: 'updates', label: 'Updates', apiCategories: ['changelog', 'release'] },
  { id: 'news', label: 'News', apiCategories: ['blog'] },
  { id: 'forum', label: 'Forum', apiCategories: ['forum'] },
  { id: 'community', label: 'Community', apiCategories: ['community'] },
  { id: 'social', label: 'Social', apiCategories: ['social'] },
  { id: 'videos', label: 'Videos', apiCategories: ['video'] },
  { id: 'tutorials', label: 'Tutorials', apiCategories: ['tutorial'] },
];

export function getCategoryApiParam(categoryId) {
  const cat = FEED_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat?.apiCategories?.length) return undefined;
  return cat.apiCategories.join(',');
}

export function getEmptyFeedMessage(categoryId, officialOnly) {
  const messages = {
    all: 'No items yet. Tap Refresh to run ingest.',
    updates: 'No changelog or release items found.',
    news: 'No blog posts found.',
    forum: 'No forum announcements found.',
    community: 'No community posts found.',
    social: 'No social posts found.',
    videos: 'No YouTube videos found.',
    tutorials: 'No Cursor Learn tutorials found.',
  };
  let message = messages[categoryId] || messages.all;
  if (officialOnly) {
    message += ' Try turning off Official only.';
  }
  return message;
}
