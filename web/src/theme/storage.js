import { THEME_STORAGE_KEY } from './config.js';

/** @returns {'dark' | 'light' | null} */
export function loadSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* localStorage unavailable */
  }
  return null;
}

/** @param {'dark' | 'light'} theme */
export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* non-fatal */
  }
}
