import {
  createDefaultCategoryFilters,
  migrateFilterPrefs,
  normalizeCategoryFilters,
} from './categoryFilterPrefs.js';

const FILTER_PREFS_KEY = 'cursor_news_filter_prefs';

export function loadFilterPrefs() {
  try {
    const raw = localStorage.getItem(FILTER_PREFS_KEY);
    if (raw) return migrateFilterPrefs(JSON.parse(raw));
  } catch {
    /* ignore corrupt prefs */
  }
  return null;
}

export function saveFilterPrefs({ category, categoryFilters }) {
  try {
    localStorage.setItem(
      FILTER_PREFS_KEY,
      JSON.stringify({
        category,
        categoryFilters: normalizeCategoryFilters(categoryFilters),
      }),
    );
  } catch {
    /* non-fatal */
  }
}

export function createInitialFilterPrefs() {
  return {
    category: 'all',
    categoryFilters: createDefaultCategoryFilters(),
  };
}
