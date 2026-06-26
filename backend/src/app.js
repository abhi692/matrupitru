import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';

import { logger } from './lib/logger.js';
import { captureException } from './lib/sentry.js';
import { identityRouter } from './modules/identity/routes.js';
import { familyRouter } from './modules/family/routes.js';
import { visitRouter } from './modules/visit/routes.js';
import { healthRouter } from './modules/health/routes.js';
import { alertsRouter } from './modules/alerts/routes.js';
import { bookingRouter } from './modules/booking/routes.js';
import { billingRouter } from './modules/billing/routes.js';
import { caregiverRouter } from './modules/caregiver/routes.js';
import { commsRouter } from './modules/comms/routes.js';
import { adminRouter } from './modules/admin/routes.js';
import { aiRouter } from './modules/ai/routes.js';
import { omitPasswordHash } from './lib/sanitize.js';
import { UPLOAD_DIR } from './lib/upload.js';

// Express app assembly, split out from index.js so tests can import it
// directly (supertest-style) without binding a port or starting schedulers.
export const app = express();
app.use(cors());
app.use(express.json());

// Structured request logging (method, path, status, duration, request id) —
// quiet in tests (NODE_ENV=test) so suite output stays readable.
if (process.env.NODE_ENV !== 'test') {
  app.use(pinoHttp({ logger }));
}

app.use('/uploads', express.static(UPLOAD_DIR));

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
v1.use(commsRouter);
v1.use(adminRouter);
v1.use(aiRouter);
app.use('/v1', v1);

app.use((err, req, res, next) => {
  logger.error({ err, path: req.path }, 'Unhandled request error');
  captureException(err);
  res.status(500).json({ error: 'Internal server error' });
});
