import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_PREFS_KEY,
  LAST_SEEN_KEY,
} from '../config/notifications';

export async function loadNotificationPrefs() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_NOTIFICATION_PREFS,
        ...parsed,
        categories: Array.isArray(parsed.categories)
          ? parsed.categories
          : DEFAULT_NOTIFICATION_PREFS.categories,
      };
    }
  } catch {
    /* corrupt prefs */
  }
  return { ...DEFAULT_NOTIFICATION_PREFS };
}

export async function saveNotificationPrefs(prefs) {
  await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
}

export async function getLastSeenAt() {
  try {
    return await AsyncStorage.getItem(LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export async function setLastSeenAt(iso) {
  await AsyncStorage.setItem(LAST_SEEN_KEY, iso || new Date().toISOString());
}

export function toggleCategory(categories, categoryId) {
  const set = new Set(categories);
  if (set.has(categoryId)) set.delete(categoryId);
  else set.add(categoryId);
  return [...set];
}
