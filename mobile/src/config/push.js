/**
 * Push is off by default so the feed works without a native rebuild.
 * After `npm run android` from mobile/, set EXPO_PUBLIC_ENABLE_PUSH=true in env/mobile/.env
 * and restart Metro.
 */
export const PUSH_ENABLED = process.env.EXPO_PUBLIC_ENABLE_PUSH === 'true';

export const PUSH_REBUILD_HINT =
  'Push alerts require a dev client rebuild. From mobile/: npm run android, then set EXPO_PUBLIC_ENABLE_PUSH=true in env/mobile/.env and restart Metro.';
