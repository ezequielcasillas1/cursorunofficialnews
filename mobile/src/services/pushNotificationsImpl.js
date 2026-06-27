import Constants from 'expo-constants';
import { Linking, Platform } from 'react-native';
import { assembleSinglePush } from '../../shared/notifications/assemble-push.js';
import { registerDevice, unregisterDevice } from '../api/newsClient';
import { PUSH_REBUILD_HINT } from '../config/push';

let notificationsModule = null;
let notificationsLoadAttempted = false;
let notificationsUnavailableReason = null;

async function loadNotifications() {
  if (notificationsModule) return notificationsModule;
  if (notificationsLoadAttempted) {
    if (notificationsUnavailableReason) {
      throw new Error(notificationsUnavailableReason);
    }
    return notificationsModule;
  }

  notificationsLoadAttempted = true;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationsModule = Notifications;
    return notificationsModule;
  } catch (err) {
    const message = err?.message || String(err);
    notificationsUnavailableReason =
      message.includes('ExpoPushTokenManager') ||
      message.includes('ExpoDevice') ||
      message.includes('native module')
        ? PUSH_REBUILD_HINT
        : message || 'Push notifications unavailable.';
    throw new Error(notificationsUnavailableReason);
  }
}

export async function ensurePushPermissions() {
  if (!Constants.isDevice) {
    return { granted: false, reason: 'Push requires a physical device.' };
  }

  try {
    const Notifications = await loadNotifications();
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { granted: false, reason: 'Notification permission denied.' };
    }

    return { granted: true };
  } catch (err) {
    return { granted: false, reason: err.message || 'Push notifications unavailable.' };
  }
}

export async function getExpoPushToken() {
  const perm = await ensurePushPermissions();
  if (!perm.granted) return { token: null, ...perm };

  const Notifications = await loadNotifications();
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenResult = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('cursor-news', {
      name: 'Cursor News',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'New Cursor headlines and release notes',
    });
  }

  return { token: tokenResult.data, granted: true };
}

export async function syncDeviceRegistration(prefs) {
  const { token, granted, reason } = await getExpoPushToken();

  if (!prefs.enabled) {
    if (token) {
      await unregisterDevice(token);
    }
    return { ok: true, unregistered: true };
  }

  if (!token) return { ok: false, reason: reason || 'No push token' };

  await registerDevice({
    token,
    platform: Platform.OS,
    categories: prefs.categories,
    enabled: true,
  });

  return { ok: true, token };
}

const noopSubscription = { remove: () => {} };

export async function addNotificationResponseListener(onOpenUrl) {
  try {
    const Notifications = await loadNotifications();
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (url && onOpenUrl) onOpenUrl(url);
    });
  } catch {
    return noopSubscription;
  }
}

export async function openNotificationUrl(url) {
  if (url) await Linking.openURL(url);
}

export async function scheduleLocalPreviewNotification(item) {
  const Notifications = await loadNotifications();
  const payload = assembleSinglePush(item);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
    trigger: null,
  });
}
