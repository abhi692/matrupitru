# Getting MatruPitru into the App Store and Play Store

What's already done (see `app.json` and `eas.json`): bundle identifiers (`com.matrupitru.app`),
build version numbers, a splash screen, and EAS build profiles (development / preview /
production). What's left needs your own accounts, credentials, and payment — none of that can be
done on your behalf. This doc is the exact sequence.

## ⚠️ Blocking prerequisite: deploy the backend publicly first

`src/config.js` currently points at your PC's LAN IP (`http://192.168.18.10:4000/v1`). That only
works because your phone and dev machine are on the same Wi-Fi. **An app installed from the App
Store/Play Store will be on someone else's network and literally cannot reach your laptop.**
Before any production build is worth making, the backend needs a real public URL.

Cheapest paths (all have free tiers, all require you to sign up yourself):
- **Railway** (railway.app) — easiest for a Node + SQLite app; note SQLite needs a persistent
  volume, or switch `DATABASE_URL` to a hosted Postgres (Railway/Neon/Supabase all have free tiers)
  per the swap path already documented in the schema.
- **Render** (render.com) — similar, has a managed Postgres free tier too.
- **Fly.io** — more control, slightly more setup.

Once deployed, update `mobile-parent/src/config.js`:
```js
export const API_BASE_URL = 'https://your-backend.up.railway.app/v1';
```
and the frontend's API proxy / `VITE_*` env if you deploy the website too (Vercel/Netlify both
have one-click Vite deploys).

**Do this first.** Everything below assumes it's done.

## Step 1 — Expo account + EAS login

1. Create a free account at https://expo.dev/signup (you do this — it's your account).
2. In `mobile-parent/`, run:
   ```
   npx eas-cli login
   ```
   Enter your Expo credentials when prompted (in your own terminal — not something to paste to me).
3. Link this project to your account:
   ```
   npx eas-cli init
   ```
   This writes a real `extra.eas.projectId` into `app.json` automatically.

## Step 2 — Internal test build (no store account needed yet)

This gets you an installable build to test on a real device before spending any money on developer
accounts:
```
npx eas-cli build --platform android --profile preview
```
This produces a downloadable `.apk` — install it directly on any Android phone (enable "install
from unknown sources" if prompted). For iOS, internal builds still need at least a free Apple ID
registered as a device tester, but a full ad-hoc/TestFlight build needs Step 3 first.

## Step 3 — Developer accounts (paid, yours to create)

- **Apple Developer Program** — https://developer.apple.com/programs/enroll/ — **$99/year**,
  requires your own Apple ID, identity verification (can take 24-48h), and accepting Apple's
  agreements. Required for any iOS distribution beyond a simulator.
- **Google Play Console** — https://play.google.com/console/signup — **$25 one-time**, requires
  your own Google account and identity verification.

Once you have both, run `npx eas-cli login` again if needed, then `eas build:configure` will pick
up the credentials when you run a build — EAS can auto-manage signing certificates/provisioning
profiles for you (recommended) so you don't have to deal with Apple's certificate UI directly.

## Step 4 — Production builds

```
npx eas-cli build --platform android --profile production
npx eas-cli build --platform ios --profile production
```
Android produces an `.aab` (App Bundle, what Play Store wants); iOS produces an `.ipa`.

## Step 5 — Store listings

Use `mobile-parent/STORE_LISTING.md` for the title/description/keywords copy. You'll also need:
- **Screenshots** — capture from a real device or simulator running the production build (see
  STORE_LISTING.md for required sizes).
- **Privacy Policy URL** — `<your-deployed-frontend-url>/privacy` (the page is already built; it
  just needs the frontend deployed publicly — see the backend-deployment note above, same idea).
- **Play Store "Data Safety" form** and **App Store "App Privacy" section** — answer using
  `frontend/src/pages/Privacy.jsx` as the source of truth for what's actually collected.
- **Content rating questionnaire** (Play Store) — answer honestly; this app should land in the
  lowest tier (no violence/gambling/mature content).

## Step 6 — Submit

```
npx eas-cli submit --platform android --profile production
npx eas-cli submit --platform ios --profile production
```
`eas submit` will prompt for your Play Console / App Store Connect credentials the first time
(stored locally by EAS, not by me) and uploads the build directly. After that:
- **Android**: appears in Play Console's "Production" (or "Internal testing" track first, if you
  want a soft launch) — Google's review is usually a few hours to a few days.
- **iOS**: appears in App Store Connect for review — Apple's review is typically 1-3 days, can be
  longer on first submission or if they have questions about the health-data usage.

## Recap of what's mine vs. yours

| Done already (me) | Needs you directly |
|---|---|
| Bundle identifiers, EAS build profiles | Expo account + `eas login` |
| Splash screen config | Apple Developer Program enrollment + payment |
| Privacy policy page (code) | Google Play Console account + payment |
| Store listing copy draft | Deploying the backend + frontend publicly |
| | Screenshots from a real build |
| | Filling out Data Safety / App Privacy forms |
| | `eas submit` (uses your store credentials) |
