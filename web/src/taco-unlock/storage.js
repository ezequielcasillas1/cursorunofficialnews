import { TACO_UNLOCKED_STORAGE_KEY } from '../../../mobile/shared/taco-unlock/config.js';

export function loadTacoUnlocked() {
  try {
    return localStorage.getItem(TACO_UNLOCKED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveTacoUnlocked(unlocked) {
  try {
    if (unlocked) {
      localStorage.setItem(TACO_UNLOCKED_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(TACO_UNLOCKED_STORAGE_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}
