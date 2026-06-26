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

## What's in here, per role

- **Parent**: real OS-scheduled medication alarms (fire even with the app closed/phone locked),
  SOS, visit confirmation, voice announcements (`expo-speech`).
- **Buyer**: dashboard (visits, vitals, alerts, care plan), visit detail with proof artifacts, SOS,
  book a service + mock payment, billing/subscription, Care Manager chat.
- **Care Manager**: alert queue, family roster, chat, recurring medication reminder setup, visit
  scheduling.
- **Caregiver**: visit list, check-in/out using **real device GPS** (`expo-location` — more
  accurate than the website's simulated-coordinates version), **real camera capture**
  (`expo-image-picker`) for proof photos, medication marking.
- **Admin**: caregiver verification + city coverage, live SLA dashboard, audit log.

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

## Demo accounts (password123 for all)

| Role | Phone |
|---|---|
| Buyer (Anjali Rao) | +12065550100 |
| Parent (Lakshmi Rao) | +919900000003 |
| Care Manager (Ravi Kumar) | +919900000001 |
| Caregiver (Ramesh Naik) | +919900000002 |
| Admin (Priya Sharma) | +919900000099 |

The login screen has tap-to-fill demo account cards, same as the website.

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

- **Buyer onboarding isn't in the mobile app.** Onboard a parent from the website first; the
  mobile buyer dashboard reads that data fine once it exists.
- **Visit scheduling is simplified** to "schedule for 1 hour from now" — no date/time picker
  dependency was added to keep this build lean. Full date/time scheduling, same as the website,
  would need `@react-native-community/datetimepicker`.
- **Caregiver offline queue isn't ported.** The website's caregiver app queues check-in/out in
  IndexedDB when offline; this native version doesn't have that yet (would need an AsyncStorage
  queue + `@react-native-community/netinfo`).
- **Schedule changes sync on app-open, not push.** Same limitation as the original parent-only
  build — no FCM/APNs wiring yet, so a new/paused reminder is picked up next time the app is
  opened, not instantly.
- **No real distribution.** This runs via Expo Go for dev/testing. A real installable app icon
  needs `eas build` (works for iOS without a Mac) plus, for app stores, developer accounts on both
  platforms — not done here.
