import { Expo } from 'expo-server-sdk';

// Expo's push service fans out to both APNs and FCM from one call — avoids
// needing separate Apple/Google developer-console push credentials for Phase 1.
const expo = new Expo();

export async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(pushToken)) return { status: 'skipped', reason: 'not an Expo push token' };
  const [ticket] = await expo.sendPushNotificationsAsync([{ to: pushToken, sound: 'default', title, body, data }]);
  return ticket;
}
