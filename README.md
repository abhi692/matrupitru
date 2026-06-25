# MatruPitru — Phase 1 (Trust MVP)

Local, runnable implementation of Phase 1 from `MatruPitru_System_Design_1.md`: family onboarding,
geo-verified visits with proof of care, parent confirmation, SOS with dispatch, vitals/medication
alerts, an admin/ops console, real-time chat, an AI family digest, basic localisation + voice, and
mocked billing/services. External integrations that need real infra (Razorpay/Stripe, SMS/WhatsApp,
cloud object storage) are stubbed the same way, swappable later without touching call sites.

## Stack

- **Backend**: Node + Express, Prisma ORM, SQLite for local dev (swap to Postgres for prod by
  changing `datasource.provider` in `backend/prisma/schema.prisma`).
- **Frontend**: React + Vite + Tailwind, single app with role-based views (buyer / care manager /
  caregiver / parent / admin) standing in for the real-world surfaces described in the design doc.

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

Optional: set `ANTHROPIC_API_KEY` in `backend/.env` to enable the AI family update digest on the
buyer dashboard. Without it, that one feature returns a clear 503 and everything else is unaffected.

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

**Health (§6.3, §1.1)** — Vitals with rule-based out-of-range flagging; medication reminders with
adherence logging (given/missed) that raises real alerts on a missed dose.

**Admin/ops (§1.1)** — Dedicated admin console: verify/reject caregivers, manage per-caregiver city
coverage, and a live SLA dashboard (geo-verified rate, missed-visit rate, SOS ack time, retention
proxy) computed from real data — plus an audit-log viewer over the event stream.

**Communication** — Real-time buyer ↔ Care Manager chat (polling-based), one thread per family.

**Localisation & accessibility (§1.2)** — English/Hindi/Kannada translations (not just a locale
field) with a language switcher; the parent app additionally supports text-to-speech read-aloud and
voice confirmation via the browser's native Web Speech API — no third-party key required.

**Resilience** — The caregiver field app queues check-in/out actions in IndexedDB when offline and
auto-syncs on reconnect; a minimal service worker caches the app shell for production builds.
Money/visit-creating endpoints accept an `Idempotency-Key` header (§5) and replay-safe.

**AI (§10.1)** — One real LLM-backed feature: the buyer dashboard can generate a warm weekly family
update from recent visit/vitals data via the Anthropic API, in the buyer's language. Gated entirely
on `ANTHROPIC_API_KEY`; the rest of the app has zero AI dependency, matching the doc's own Phase 1
phasing (AI stays minimal until the human trust loop is proven).

**Compliance scaffold (§9)** — Explicit consent capture at family/parent creation (not just a
timestamp default), plus an admin-visible audit log built on the event stream.

## What's mocked / deferred

- Payments (Razorpay/Stripe) — mock success responses
- SMS/WhatsApp/voice notifications — console-logged stand-ins in `backend/src/lib/notify.js`
- Native offline-first caregiver app — the web version gets the *offline-survival* property via an
  IndexedDB sync queue instead of a native app; full native (Phase 1 open question #5) is still open
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
