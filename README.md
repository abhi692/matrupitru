# MatruPitru — Trust MVP + production-readiness pass

Local, runnable implementation of `MatruPitru_System_Design_1.md`, taken past the original Phase 1
scope into the production-readiness gaps identified in a PM-style review: multi-buyer families,
real (test-mode) Razorpay/Stripe payments, real Expo push notifications, real Daily.co video
check-ins, an SOS escalation tree, a caregiver document-verification pipeline, a unified care
timeline feed, caregiver ratings, seven Indian languages, an automated backend test suite, and
structured logging + optional Sentry. Every external integration that needs real infra is gated
behind its own env var with a documented mock fallback — nothing silently pretends to work.

## Stack

- **Backend**: Node + Express, Prisma ORM, SQLite for local dev (swap to Postgres for prod by
  changing `datasource.provider` in `backend/prisma/schema.prisma`).
- **Frontend**: React + Vite + Tailwind, single app with role-based views (buyer / care manager /
  caregiver / admin / parent) standing in for the real-world surfaces described in the design doc.
- **mobile-parent**: a real React Native (Expo) app covering all five roles natively, role decided
  at sign-in same as the website — see `mobile-parent/README.md`. Started as a parent-only app to
  fix medication alarms (need to fire even with nothing open in a browser) and grew into full
  native coverage; the folder name is historical.

## Running locally

### Backend

```
cd backend
npm install
cp .env.example .env
npx prisma db push
node prisma/seed.js
npm run dev
```

API runs on `http://localhost:4000`. Seed creates a demo family (see console output for IDs):

| Role | Phone | Password |
|---|---|---|
| Buyer (Anjali Rao) | +12065550100 | password123 |
| Parent (Lakshmi Rao) | +919900000003 | password123 |
| Care Manager (Ravi Kumar) | +919900000001 | password123 |
| Caregiver (Ramesh Naik, verified) | +919900000002 | password123 |
| Caregiver (Suma Patil, pending verification) | +919900000004 | password123 |
| Admin (Priya Sharma) | +919900000099 | password123 |

Optional integrations — every one below is gated behind its env var; without it set, the feature
falls back to a clear mock/503 and the rest of the app is unaffected:

| Feature | Env var(s) | Without it |
|---|---|---|
| AI family update digest | `ANTHROPIC_API_KEY` | 503 on that one endpoint |
| Razorpay (INR payments) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | mock-success payment |
| Stripe (intl payments) | `STRIPE_SECRET_KEY` (+ `VITE_STRIPE_PUBLISHABLE_KEY` in `frontend/.env`) | mock-success payment |
| Video check-ins (Daily.co) | `DAILY_API_KEY` | 503 on video-session creation |
| WhatsApp Business API | `WHATSAPP_BUSINESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | logs the message instead of sending |
| Error tracking | `SENTRY_DSN` | errors go to structured logs only |

Push notifications (Expo Push service) work without any extra key — the mobile app registers a real
Expo push token on login (`PATCH /v1/me/push-token`), and the backend sends real pushes to it.

### Running tests

```
cd backend
npm test
```

Runs the full backend test suite (auth, family/invites, visit lifecycle + ratings, SOS + alerts,
payments fallback) against a disposable SQLite database (`prisma/test.db`) — not the dev database —
using Node's built-in test runner + supertest. See `backend/tests/`.

### Frontend

```
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`, proxying `/v1/*` to the backend. Log in with any demo account
above (the login page has one-click demo account buttons). Language switcher in the header covers
English/Hindi/Kannada; the parent app also supports voice input/output (Web Speech API).

## What's implemented

**Core trust loop (§6.1)** — Visit scheduling (care manager, city-coverage enforced) → caregiver
check-in/out with geo-verification against the parent's home address → real photo proof upload
(local-disk object-store stand-in) → parent confirmation, with caregiver verification status and
rating surfaced to the buyer.

**Safety (§6.2)** — SOS raises an emergency alert, notifies Care Manager + buyer across mocked
channels, auto-dispatches the nearest available verified caregiver, and places the parent's
preferred hospital on standby — all console-logged, all real backend logic.

**Health (§6.3, §1.1)** — Vitals with rule-based out-of-range flagging. Medication reminders are
fully automated end to end: a buyer/Care Manager sets up a recurring schedule once ("Amlodipine,
daily at 08:00 and 20:00"), and a backend scheduler (`backend/src/scheduler/medication.js`, runs
every 30s) generates each day's reminder, fires it automatically, and rings a real audible alarm +
voice announcement on the parent's device (Web Audio + speech synthesis) when it's due — no
caregiver visit or manual entry involved. If the parent doesn't acknowledge within the configured
grace period, it auto-escalates to a missed-dose alert on its own.

**Admin/ops (§1.1)** — Dedicated admin console: verify/reject caregivers, manage per-caregiver city
coverage, and a live SLA dashboard (geo-verified rate, missed-visit rate, SOS ack time, retention
proxy) computed from real data — plus an audit-log viewer over the event stream.

**Communication** — Real-time buyer ↔ Care Manager chat (polling-based), one thread per family, plus
real video check-ins via Daily.co (`POST /v1/families/:id/video-sessions`) — a Daily room is itself
a complete prebuilt video UI at a plain URL, so no client SDK is needed on web or mobile.

**Multi-buyer families** — A buyer can invite a sibling by phone (`POST /v1/families/:id/invites`);
the invited person sees the same dashboard, alerts, and timeline once they register or log in —
families with two or three adult children sharing care responsibility, not just one buyer.

**Payments** — Real (test-mode) Razorpay for INR/UPI and Stripe for international cards, each gated
behind its own key with a graceful mock-success fallback. Razorpay Checkout.js and Stripe Elements
are driven from the buyer web app's Book-a-service flow; both confirm through a shared
`POST /v1/payments/:id/verify` endpoint.

**SOS escalation tree (§6.2)** — Raising SOS no longer stops at "notify the Care Manager and hope."
A background scheduler (`backend/src/scheduler/escalation.js`) automatically works down the parent's
emergency-contacts list every 2 minutes if nobody acknowledges, and keeps re-alerting the Care
Manager + buyers once contacts run out — fully automated, no one has to remember to chase it up.

**Caregiver verification document pipeline** — Caregivers upload police-verification / ID-proof /
reference-letter / training-certificate documents; an admin reviews and approves/rejects each one
individually, matching how trust verification actually works for in-home care in India (not just an
admin flipping a status flag).

**Caregiver ratings** — Buyers rate a caregiver 1–5 stars after a completed visit; the aggregate
feeds the caregiver's rating shown to Care Managers when assigning future visits.

**Care timeline feed** — A single chronological narrative (`GET /v1/families/:id/timeline`) merging
visits, flagged vitals, alerts, medication events, and ratings into one story instead of several
dashboard widgets a buyer has to mentally merge.

**Localisation & accessibility (§1.2)** — English, Hindi, Kannada, Tamil, Telugu, Bengali, and
Marathi translations (not just a locale field) with a language switcher; the parent app additionally
supports text-to-speech read-aloud and voice confirmation via the browser's native Web Speech API —
no third-party key required.

**Push notifications** — The mobile app registers a real Expo push token on login; SOS, alerts, and
medication reminders fire real Expo push notifications to whoever has one registered, in addition to
the existing mocked SMS/WhatsApp channels.

**Resilience** — The caregiver field app queues check-in/out actions in IndexedDB when offline and
auto-syncs on reconnect; a minimal service worker caches the app shell for production builds.
Money/visit-creating endpoints accept an `Idempotency-Key` header (§5) and replay-safe.

**AI (§10.1)** — One real LLM-backed feature: the buyer dashboard can generate a warm weekly family
update from recent visit/vitals data via the Anthropic API, in the buyer's language. Gated entirely
on `ANTHROPIC_API_KEY`; the rest of the app has zero AI dependency, matching the doc's own Phase 1
phasing (AI stays minimal until the human trust loop is proven).

**Compliance scaffold (§9)** — Explicit consent capture at family/parent creation (not just a
timestamp default), plus an admin-visible audit log built on the event stream.

**Observability** — Structured JSON request/error logging via Pino (pretty-printed in dev); optional
Sentry error tracking gated behind `SENTRY_DSN`. An admin-only `GET /v1/admin/integrations` endpoint
reports which optional gateways are live vs. mocked at a glance.

**Testing** — An automated backend test suite (Node's built-in test runner + supertest) covering
auth, family/sibling-invites, the full visit lifecycle + ratings, SOS + alert acknowledgement, and
the payments mock-fallback path, run against a disposable database — see "Running tests" above.

## What's mocked / deferred

- WhatsApp Business API — shaped and ready (`backend/src/lib/whatsapp.js`), pending Meta Business
  verification; logs the message it would send until `WHATSAPP_BUSINESS_TOKEN`/`WHATSAPP_PHONE_NUMBER_ID` are set
- SMS/voice notifications — console-logged stand-ins in `backend/src/lib/notify.js`
- Recurring subscription billing — mocked (no gateway has a stable test-mode recurring-mandate flow
  worth wiring up yet); one-time service payments are real
- Native offline-first caregiver app — the web version gets the *offline-survival* property via an
  IndexedDB sync queue instead of a native app
- Redis cache/queue layer — not needed at current scale; noted as a deviation from §3's diagram
- DPDP full legal compliance — consent capture + audit log are scaffolded, but this isn't a
  substitute for actual legal review
- IVR/telephony fallback for SOS — voice I/O exists in the parent *app*, but there's no phone-based
  fallback for parents without a smartphone

## Architecture notes

- Backend is a modular monolith (`backend/src/modules/*`) matching the design doc's §3.1
  recommendation — one deployable, clean module boundaries, extractable later.
- An in-process event bus (`backend/src/events/bus.js`) persists every event to an `Event` table
  and fans out in-process, standing in for the message-bus described in §3.
- `VitalsReading` carries an explicit comment + index marking it as logically time-series; the
  production swap path (Timescale/InfluxDB) is documented in the schema rather than built, since a
  separate time-series store isn't justified at this scale.
