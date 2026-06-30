import AsyncStorage from '@react-native-async-storage/async-storage';
import { TACO_UNLOCKED_STORAGE_KEY } from '../../shared/taco-unlock/config.js';

const STORAGE_KEY = `@${TACO_UNLOCKED_STORAGE_KEY}`;

export async function loadTacoUnlocked() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveTacoUnlocked(unlocked) {
  try {
    if (unlocked) {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* non-fatal */
  }
}
