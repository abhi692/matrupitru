import * as Notifications from 'expo-notifications';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

// Expo Go removed remote-push support entirely (Android in SDK 53, iOS earlier) —
// calling getExpoPushTokenAsync() there logs a scary red ERROR to the console
// every time, regardless of try/catch (it's a console.error inside the library,
// not a thrown exception, because expo-notifications itself calls console.error
// internally before the promise even rejects). Skipping it in Expo Go avoids
// the noise; it still works normally in a real dev/production build. Local
// scheduled notifications (the actual medication-alarm mechanism) are a
// separate API and unaffected.
//
// Using expo's own isRunningInExpoGo() instead of Constants.appOwnership /
// executionEnvironment — those came back unreliable (silently falsy even
// inside actual Expo Go on SDK 54), while this is the exact same detection
// expo-notifications uses internally to decide whether to print the warning,
// so it's guaranteed to agree with it.
const isExpoGo = isRunningInExpoGo();

// This is the actual fix for the thing the web app couldn't do: these are real
// OS-scheduled notifications. They fire at the right time whether the app is
// open, backgrounded, or fully closed — no polling, no open browser tab
// required. The backend's MedicationSchedule is still the source of truth for
// "is this given/missed" (and still auto-escalates on its own); this layer is
// just the wake-up call on the device.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('medication-alarms', {
    name: 'Medication alarms',
    importance: Notifications.AndroidImportance.MAX,
    // Custom synthesized alarm tone (assets/alarm.wav) instead of the
    // default notification chime — registered as a system sound via the
    // expo-notifications config plugin's `sounds` option in app.json.
    sound: 'alarm.wav',
    vibrationPattern: [0, 500, 250, 500, 250, 500],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    // Ring even if the parent's phone is in Do Not Disturb — a missed
    // medication dose is exactly the kind of thing DND shouldn't silence.
    bypassDnd: true,
  });
}

// One real loud alarm clock (ignores the silent switch/notification volume,
// rings continuously until dismissed, draws a full-screen UI even when
// locked) is an OS-level capability that Expo's managed local-notification
// API does not expose -- it needs either a custom native Android
// AlarmManager + foreground service + full-screen intent, or, on iOS,
// Apple's "Critical Alerts" entitlement, which Apple only grants to a
// narrow set of apps (mostly safety/health) after a manual application —
// neither is achievable from JS/config alone. What follows is the closest
// practical approximation within that ceiling: a custom loud tone, max
// priority + DND bypass, a time-sensitive iOS delivery level, and a second
// "didn't take it yet?" nudge a few minutes later in case the first one is
// missed (silenced phone, parent didn't hear it, etc.).
const NAG_DELAY_MINUTES = 4;

// Cancels everything and reschedules from the current set of active schedules.
// Called on login and whenever the app comes to the foreground, so changes
// made by the Care Manager (new reminder, paused reminder) pick up next time
// the parent opens the app — no background sync needed for a single-user device.
export async function scheduleAllReminders(schedules) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const schedule of schedules) {
    if (!schedule.active) continue;
    const times = JSON.parse(schedule.timesOfDayJson || '[]');
    for (const t of times) {
      const [hour, minute] = t.split(':').map(Number);

      // DAILY, not CALENDAR — CALENDAR triggers aren't supported by the native
      // Android module in this expo-notifications version ("Trigger of type:
      // calendar is not supported on Android") and are finicky enough on iOS
      // (partial date-component matching) that they were silently never
      // firing there either. DAILY does exactly what we need — fire every
      // day at this hour:minute — and is properly supported on both platforms.
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for your medicine',
          body: schedule.medication,
          sound: 'alarm.wav',
          interruptionLevel: 'timeSensitive',
          data: { medication: schedule.medication, scheduleId: schedule.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: 'medication-alarms',
        },
      });

      // Backup nudge a few minutes later. DAILY triggers don't support a
      // one-off "fire once and stop" with minute-level offsets across an
      // hour boundary cleanly, so this computes the rolled-over hour/minute
      // by hand.
      const nagTotal = hour * 60 + minute + NAG_DELAY_MINUTES;
      const nagHour = Math.floor(nagTotal / 60) % 24;
      const nagMinute = nagTotal % 60;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Still time for your medicine',
          body: `Don't forget: ${schedule.medication}`,
          sound: 'alarm.wav',
          interruptionLevel: 'timeSensitive',
          data: { medication: schedule.medication, scheduleId: schedule.id, nag: true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: nagHour,
          minute: nagMinute,
          channelId: 'medication-alarms',
        },
      });
    }
  }
}

export function addNotificationResponseListener(callback) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Gets a real Expo push token for this device so the backend can send instant
// pushes (SOS, alerts, medication reminders) instead of the user only finding
// out next time they open the app. Distinct from the local scheduled-notification
// permission above — this needs project config (works in a dev/EAS build; in
// Expo Go it resolves to a token scoped to Expo's own push sandbox project).
export async function getExpoPushToken() {
  if (isExpoGo) return null; // unsupported here — see note above; no-op, not an error
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;
  try {
    const { data } = await Notifications.getExpoPushTokenAsync();
    return data;
  } catch {
    return null;
  }
}
