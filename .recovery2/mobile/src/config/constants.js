import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveDefaultApiBase() {
  const configured = Constants.expoConfig?.extra?.apiBase;
  if (configured) return configured;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8787';
  }

  return 'http://127.0.0.1:8787';
}

export const API_BASE = resolveDefaultApiBase();

export const DISCLAIMER =
  'Unofficial fan project. Not affiliated with Anysphere or Cursor.';
