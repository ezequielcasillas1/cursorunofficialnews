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

import { OFFICIAL_ONLY_TOOLTIP, SECTION_TOOLTIPS } from '../../shared/feed/sectionTooltips';

export { OFFICIAL_ONLY_TOOLTIP };

/** User-facing feed tabs → registry categories for GET /v1/news?category= */
export const FEED_CATEGORIES = [
  { id: 'all', label: 'All', apiCategories: null, tooltip: SECTION_TOOLTIPS.all },
  { id: 'updates', label: 'Updates', apiCategories: ['changelog', 'release'], tooltip: SECTION_TOOLTIPS.updates },
  { id: 'news', label: 'News', apiCategories: ['blog'], tooltip: SECTION_TOOLTIPS.news },
  { id: 'forum', label: 'Forum', apiCategories: ['forum'], tooltip: SECTION_TOOLTIPS.forum },
  { id: 'issues', label: 'Issues', apiCategories: ['issue'], tooltip: SECTION_TOOLTIPS.issues },
  { id: 'community', label: 'Community', apiCategories: ['community'], tooltip: SECTION_TOOLTIPS.community },
  { id: 'discussion', label: 'Discussion', apiCategories: ['discussion'], tooltip: SECTION_TOOLTIPS.discussion },
  { id: 'social', label: 'Social', apiCategories: ['social'], tooltip: SECTION_TOOLTIPS.social },
  { id: 'videos', label: 'Videos', apiCategories: ['video'], tooltip: SECTION_TOOLTIPS.videos },
  { id: 'tutorials', label: 'Tutorials', apiCategories: ['tutorial'], tooltip: SECTION_TOOLTIPS.tutorials },
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
    issues: 'No bug or issue reports right now.',
    community: 'No community posts found.',
    discussion: 'No discussion or opinion posts found.',
    social: 'No social posts found.',
    videos: 'No YouTube videos found.',
    tutorials: 'No tutorials found yet. Try Refresh.',
  };
  let message = messages[categoryId] || messages.all;
  if (officialOnly) {
    message += ' Try turning off Official only.';
  }
  return message;
}
