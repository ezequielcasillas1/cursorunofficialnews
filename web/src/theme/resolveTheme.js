import { DEFAULT_THEME } from './config.js';

/**
 * Resolve active theme from saved preference.
 * First visit / shared links default to dark unless user saved light.
 *
 * @param {string | null | undefined} savedTheme
 * @returns {'dark' | 'light'}
 */
export function resolveTheme(savedTheme) {
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }
  return DEFAULT_THEME;
}
