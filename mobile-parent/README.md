# MatruPitru — Mobile App (React Native / Expo)

A real native app covering **all five roles** — buyer, parent, Care Manager, caregiver, admin —
with the same role-based-on-sign-in model as the website: log in, and the app shows the screens
for your account's role. One Expo project, one install, role decided at login.

The folder is still named `mobile-parent` for historical reasons (it started as a parent-only app
to fix medication alarms); it now covers every role.

## Why this exists alongside the website

The website still works fine for everyone. This app exists because **medication alarms need to
fire even when nothing is open in a browser** — that's an OS-level capability only a real native
app has. Once we were building native anyway, "all roles, same as the website" was the natural
next step. Functionally near-parity with the website; a few things are intentionally simplified
(see "Known gaps" below).

## Design

Clean-minimal style (Apple Health-inspired): light-gray/white surfaces, one accent color (the
brand green), generous corner radius, soft shadows instead of borders, icons throughout
(`@expo/vector-icons`). Every role except Parent (which only has one real screen) gets a bottom
tab bar instead of one long scrolling page — each tab is a focused, single-purpose screen instead
of a dense form-and-list dump.

## What's in here, per role

- **Parent** (single screen, no tabs needed): real OS-scheduled medication alarms (fire even with
  the app closed/phone locked), SOS, visit confirmation, voice announcements (`expo-speech`), and a
  "Join video call" banner that appears automatically when the buyer starts a Daily.co video session.
- **Buyer** — tabs: *Home* (dashboard → onboard a parent if none exists yet → visit detail → care
  timeline, start video call), *Book*, *Billing*, *Chat*, *SOS*. Onboarding is the same 5-step flow
  as the website (consent → parent basics → health profile → emergency contact → care plan), with a
  "Use my current location" button (`expo-location`) instead of typing lat/lng.
- **Care Manager** — tabs: *Alerts*, *Families*, *Schedule* (medication reminders with a native
  clock-based time picker, visits with a real date+time picker), *Chat*.
- **Caregiver** — tabs: *Today* (active visits — check-in/out with **real device GPS** via
  `expo-location`, **real camera capture** via `expo-image-picker` for proof photos, medication
  marking), *History* (completed visits).
- **Admin** — tabs: *Overview* (SLA dashboard), *Caregivers* (verification + city coverage),
  *Audit* (event log).

All roles register a real Expo push token with the backend on login (`PATCH /v1/me/push-token`) —
SOS, alerts, and medication reminders can reach the device via a real push, not just on next
app-open poll.

## Setup

```
cd mobile-parent
npm install
```

Edit `src/config.js` — `API_BASE_URL` must be your PC's **LAN IP**, not `localhost` (the phone is a
separate device on the network). Find it with `ipconfig` (Wi-Fi adapter's IPv4). The backend
(`cd ../backend && npm run dev`) must be running, and your phone must be on the same Wi-Fi.

```
npx expo start
```

Scan the QR code with **Expo Go** (Play Store / App Store). If you see "project is incompatible
with this version of Expo Go" even on an up-to-date phone: npm's "latest" Expo SDK tag usually runs
ahead of what's actually published in the App Store's Expo Go binary. This project is pinned to
SDK 54 specifically because it's had time to propagate — if you still hit this, check
`npm view expo dist-tags` for the newest SDK that's been out a while and `npx expo install expo@<version> && npx expo install --fix` to match it.

**Same issue can hit individual packages, not just Expo itself** — `@expo/vector-icons`'s "latest"
(15.1.1 at time of writing) ships a broken `main` field pointing at a file that doesn't exist in
the published package. This project is pinned to `15.0.3` (the version Expo's own compatibility
checker recommends for SDK 54) which works correctly. If `npx expo install --fix` ever bumps a
package to something broken, check the package's own `build/`/`lib/` output exists before assuming
your code is wrong.

**Android + Expo Go + notifications**: since SDK 53, Expo Go no longer supports *remote* push
notifications (a Google/Apple policy change, not a bug in this app) and prints an `ERROR` about it
on startup. This project only uses *local* scheduled notifications (`scheduleNotificationAsync`) for
the medication alarm itself — a different code path that fires fine in Expo Go. The one place that
genuinely needs remote push is `getExpoPushToken()` in `src/lib/notifications.js` (used to register
this device for instant SOS/alert/reminder pushes from the backend); it now detects Expo Go with
`isRunningInExpoGo()` from the `expo` package and skips itself there instead of logging the error on
every login — push registration silently no-ops in Expo Go and works normally in a real dev/EAS
build. (An earlier version of this check used `Constants.appOwnership`/`executionEnvironment` from
`expo-constants`, which turned out to be unreliable on SDK 54 — `isRunningInExpoGo()` is the exact
function `expo-notifications` uses internally to decide whether to print the warning in the first
place, so it's guaranteed to agree with it.)

**Dropdowns (Select component)**: the original implementation used the native
`@react-native-picker/picker` widget, which has long-standing rendering bugs in Expo Go on Android —
on some devices/Android versions the dropdown either doesn't open or opens with no visible/tappable
rows. `src/components/Select.js` was rewritten as a custom `Modal` + list picker (no native widget
dependency), which renders identically and reliably on every device. Same props (`value`,
`onValueChange`, `items`, `placeholder`), so nothing else needed to change.

**Daily medication times**: replaced the "type HH:MM, comma separated" text field with
`src/components/TimeListPicker.js` — an "Add time" button that opens the device's native clock UI
(`@react-native-community/datetimepicker`) and adds a removable chip per time, building the same
`["HH:MM", ...]` array the backend schedule API expects.

**Phone entry (`src/components/PhoneInput.js`)**: a real country-code picker (flag + dial code,
tap to search/select from `src/components/countries.js`), not just a fixed +91 — plenty of users
are Indian but settled abroad (NRIs), or aren't Indian at all. Defaults to India since that's this
app's primary market. The seeded demo buyer (Anjali Rao) is intentionally a non-Indian number
(+1, Seattle) to reflect the NRI-daughter persona; demo-account taps on the login screen log
straight in instead of populating this field, so that one number never has to round-trip through
the picker.

If you change Metro/node_modules after the dev server is already running (e.g. installing a new
package), restart with `npx expo start --clear` — a stale Metro cache from before the install can
cause `Unable to resolve module` errors that look like real bugs but are just an out-of-date cache.

## Demo accounts (password123 for all)

| Role | Phone |
|---|---|
| Buyer (Anjali Rao) | +12065550100 |
| Parent (Lakshmi Rao) | +919900000003 |
| Care Manager (Ravi Kumar) | +919900000001 |
| Caregiver (Ramesh Naik) | +919900000002 |
| Admin (Priya Sharma) | +919900000099 |

The login screen has tap-to-fill demo account cards, same as the website.

**Medication alarm trigger type**: `src/lib/notifications.js` schedules with
`SchedulableTriggerInputTypes.DAILY` (fire every day at this hour:minute), not `CALENDAR`. An
earlier version used `CALENDAR`, which threw `"Trigger of type: calendar is not supported on
Android"` on real Android devices (the native Android module in this expo-notifications version
doesn't implement it) and was also silently never firing on iOS, where calendar triggers' partial
date-component matching is finicky. `DAILY` is the purpose-built trigger for exactly this use case
and is documented as supported on both platforms — fixed after reproducing the Android crash on a
real device; re-test on both platforms to confirm the alarm actually rings at the scheduled time.

## Testing the medication alarm (the headline feature)

1. Log in as **Care Manager**, set up a medication schedule for 1-2 minutes out.
2. Log in as **Parent** on the same device (or a second device/Expo Go instance).
3. **Fully close the app.**
4. At the scheduled time, the phone rings/buzzes with a real system notification — works locked,
   works closed.
5. Tap it → app opens to the alarm card → "I took it".
6. Ignore it instead, and the backend auto-marks it missed after the grace period on its own —
   check the Care Manager's alert queue.

## Known gaps vs. the website

- **Caregiver offline queue isn't ported.** The website's caregiver app queues check-in/out in
  IndexedDB when offline; this native version doesn't have that yet (would need an AsyncStorage
  queue + `@react-native-community/netinfo`).
- **Schedule changes sync on app-open, not push.** Same limitation as the original parent-only
  build — no FCM/APNs wiring yet, so a new/paused reminder is picked up next time the app is
  opened, not instantly.
- **No real distribution.** This runs via Expo Go for dev/testing. A real installable app icon
  needs `eas build` (works for iOS without a Mac) plus, for app stores, developer accounts on both
  platforms — not done here.
