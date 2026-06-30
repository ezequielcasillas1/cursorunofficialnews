import { SOURCES_HIDDEN_STORAGE_KEY } from '../../../mobile/shared/sources/visibility-config.js';

export function loadSourcesHidden() {
  try {
    return localStorage.getItem(SOURCES_HIDDEN_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveSourcesHidden(hidden) {
  try {
    if (hidden) {
      localStorage.setItem(SOURCES_HIDDEN_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(SOURCES_HIDDEN_STORAGE_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}
