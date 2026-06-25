import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { identityRouter } from './modules/identity/routes.js';
import { familyRouter } from './modules/family/routes.js';
import { visitRouter } from './modules/visit/routes.js';
import { healthRouter } from './modules/health/routes.js';
import { alertsRouter } from './modules/alerts/routes.js';
import { bookingRouter } from './modules/booking/routes.js';
import { billingRouter } from './modules/billing/routes.js';
import { caregiverRouter } from './modules/caregiver/routes.js';
import { omitPasswordHash } from './lib/sanitize.js';

const app = express();
app.use(cors());
app.use(express.json());

// Last line of defense: strip passwordHash from every JSON response, even if a
// route forgets to do it explicitly (User is nested deep in several payloads).
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(omitPasswordHash(body));
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const v1 = express.Router();
v1.use(identityRouter);
v1.use(familyRouter);
v1.use(visitRouter);
v1.use(healthRouter);
v1.use(alertsRouter);
v1.use(bookingRouter);
v1.use(billingRouter);
v1.use(caregiverRouter);
app.use('/v1', v1);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`MatruPitru API listening on :${port}`));
