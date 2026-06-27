import { Linking } from 'react-native';
import { PUSH_ENABLED, PUSH_REBUILD_HINT } from '../config/push';

const noopSubscription = { remove: () => {} };

let implModule = null;

async function loadImpl() {
  if (!implModule) {
    implModule = await import('./pushNotificationsImpl');
  }
  return implModule;
}

export async function ensurePushPermissions() {
  if (!PUSH_ENABLED) {
    return { granted: false, reason: PUSH_REBUILD_HINT };
  }
  const impl = await loadImpl();
  return impl.ensurePushPermissions();
}

export async function getExpoPushToken() {
  if (!PUSH_ENABLED) {
    return { token: null, granted: false, reason: PUSH_REBUILD_HINT };
  }
  const impl = await loadImpl();
  return impl.getExpoPushToken();
}

export async function syncDeviceRegistration(prefs) {
  if (!PUSH_ENABLED) {
    return { ok: false, reason: PUSH_REBUILD_HINT };
  }
  const impl = await loadImpl();
  return impl.syncDeviceRegistration(prefs);
}

export async function addNotificationResponseListener(onOpenUrl) {
  if (!PUSH_ENABLED) {
    return noopSubscription;
  }
  const impl = await loadImpl();
  return impl.addNotificationResponseListener(onOpenUrl);
}

export async function openNotificationUrl(url) {
  if (url) await Linking.openURL(url);
}

export async function scheduleLocalPreviewNotification(item) {
  if (!PUSH_ENABLED) {
    throw new Error(PUSH_REBUILD_HINT);
  }
  const impl = await loadImpl();
  return impl.scheduleLocalPreviewNotification(item);
}
