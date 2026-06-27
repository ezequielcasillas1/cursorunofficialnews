import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDefaultApiBase() {
  const configured = Constants.expoConfig?.extra?.apiBase;
  if (configured) return configured;

  if (Platform.OS === 'android') {
    // 10.0.2.2 reaches the host only on the Android emulator.
    const isEmulator = Constants.isDevice === false;
    if (isEmulator) return 'http://10.0.2.2:8787';
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
  { id: 'videos', label: 'Videos', apiCategories: ['video'] },
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
    videos: 'No YouTube videos found.',
  };
  let message = messages[categoryId] || messages.all;
  if (officialOnly) {
    message += ' Try turning off Official only.';
  }
  return message;
}
