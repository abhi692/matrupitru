# MatruPitru — Phase 1 (Trust MVP)

Local, runnable implementation of Phase 1 from `MatruPitru_System_Design_1.md`: family onboarding,
geo-verified visits with proof of care, parent confirmation, SOS, vitals flagging, alerts, and
mocked billing/services. External integrations (Razorpay/Stripe, SMS/WhatsApp, maps) are stubbed
for local dev and swappable later.

## Stack

- **Backend**: Node + Express, Prisma ORM, SQLite for local dev (swap to Postgres for prod by
  changing `datasource.provider` in `backend/prisma/schema.prisma`).
- **Frontend**: React + Vite, single app with role-based views (buyer / care manager / caregiver /
  parent) standing in for the four real-world surfaces described in the design doc.

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
| Caregiver (Ramesh Naik) | +919900000002 | password123 |

### Frontend

```
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`, proxying `/v1/*` to the backend. Log in with any demo account
above (the login page has one-click demo account buttons).

## What's implemented (Phase 1 scope)

- Family/parent onboarding + care plan selection
- Visit scheduling (care manager) → caregiver check-in/out with geo-verification against the
  parent's home address → proof artifact upload → parent confirmation — the full trust loop from
  design doc §6.1
- SOS flow (§6.2): raises an `emergency` alert, notifies Care Manager + buyer across mocked
  channels (push/SMS/WhatsApp/call), all logged to console
- Vitals recording with rule-based out-of-range flagging (§6.3)
- Alert queue + acknowledgement (care manager console)
- Service catalog booking + mocked payment intent / subscription
- Buyer dashboard aggregating visits, vitals, alerts, care plan

## What's mocked / deferred

- Payments (Razorpay/Stripe) — mock success responses
- SMS/WhatsApp/voice — console-logged stand-ins in `backend/src/lib/notify.js`
- Native offline-first caregiver app, IVR/voice parent interface — out of scope for this local web
  build (Phase 1 open questions #4–5 in the design doc)
- AI layer (§10) — not started; Phase 1 per the doc's own phasing keeps AI minimal/deferred

## Architecture notes

- Backend is a modular monolith (`backend/src/modules/*`) matching the design doc's §3.1
  recommendation — one deployable, clean module boundaries, extractable later.
- An in-process event bus (`backend/src/events/bus.js`) persists every event to an `Event` table
  and fans out in-process, standing in for the message-bus described in §3.
