import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOURCES_HIDDEN_STORAGE_KEY } from '../../shared/sources/visibility-config.js';

const STORAGE_KEY = `@${SOURCES_HIDDEN_STORAGE_KEY}`;

export async function loadSourcesHidden() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function saveSourcesHidden(hidden) {
  try {
    if (hidden) {
      await AsyncStorage.setItem(STORAGE_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* non-fatal */
  }
}
