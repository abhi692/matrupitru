# MatruPitru — Parent App (React Native / Expo)

A real native app for the parent, built specifically to fix the thing the web version
couldn't do: **medication alarms that fire even when the app is closed.** Everything
else (buyer, Care Manager, caregiver, admin) stays the website — they don't need
OS-level background notifications, so rebuilding them natively wasn't worth it.

## What's different from the web parent app

- **Real OS-scheduled notifications** (`expo-notifications`) instead of polling +
  Web Audio. The phone's own alarm/notification system fires the reminder — works
  even if the app is fully closed or the phone is locked.
- The backend (`backend/src/scheduler/medication.js`) is still the source of truth:
  it still auto-escalates a missed dose to an alert on its own, independent of
  whether the phone notification was seen. The native notification is the "ring the
  bell" layer; the backend is the "did they actually respond" layer.
- Login, SOS, and visit confirmation work the same as the web parent app, just in
  native components.
- Voice: text-to-speech via `expo-speech` announces the reminder. Voice *input*
  (saying "yes" to confirm) isn't included in this version — tap-to-confirm only.

## Setup

```
cd mobile-parent
npm install
```

### 1. Point it at your backend

Edit `src/config.js` — `API_BASE_URL` must be your PC's **LAN IP** (not
`localhost`), because the phone is a separate device on the network:

```js
export const API_BASE_URL = 'http://192.168.18.10:4000/v1';
```

Find your current LAN IP with `ipconfig` (look for the Wi-Fi adapter's IPv4
address) — it can change if your router reassigns it. The backend
(`cd ../backend && npm run dev`) must be running on that machine, and your **phone
must be on the same Wi-Fi network** as the PC.

### 2. Run it

```
npx expo start
```

This prints a QR code. Install **Expo Go** from the Play Store / App Store on your
phone, then scan the QR code (Android: in-app scanner; iPhone: use the Camera app).
The app loads over your Wi-Fi — no cable, no app store submission needed for
testing.

### 3. Log in

Use the parent demo account: `+919900000003` / `password123` (or any real parent
account from the backend).

## Testing the alarm for real

1. As Care Manager (on the website), set up a medication schedule for a time 1–2
   minutes from now.
2. Open the parent app once so it syncs the schedule and calls
   `Notifications.scheduleNotificationAsync` for it.
3. **Close the app completely** (swipe it away, don't just background it).
4. At the scheduled time, your phone should buzz/ring with a real system
   notification — try this with the screen locked too.
5. Tap the notification — it opens the app to the home screen, which shows the
   medication as "due" with an **"I took it"** button.
6. If you ignore it, the backend auto-marks it missed after the grace period, same
   as the web version — check `GET /v1/parents/:id/medications` from the backend
   or look at the Care Manager's alert queue.

## Known limitations (be upfront about these)

- **Schedule changes don't sync in the background.** If the Care Manager adds or
  pauses a reminder, the phone only picks it up the next time the parent opens the
  app (which re-syncs and reschedules). There's no push-based instant sync — that
  would need a real push service (FCM/APNs) wired through the backend, which is a
  bigger lift than this pass covered.
- **iOS notification reliability**: Apple is stricter about background behavior
  than Android. Local *scheduled* notifications (what this app uses) are reliable
  on both platforms since they're OS-scheduled, not app-triggered — but always
  test on the actual device you intend to use day to day.
- **Distribution**: this runs via Expo Go for development/testing. To put a real
  installable app icon on your parent's phone without Expo Go, you'd build with
  `eas build` (Expo's cloud build service — works for iOS without owning a Mac)
  and either sideload it or publish through the App Store / Play Store, which
  needs developer accounts on both platforms. Not done in this pass.
