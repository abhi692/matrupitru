import 'dotenv/config';
import { app } from './app.js';
import { logger } from './lib/logger.js';
import { sentryEnabled } from './lib/sentry.js';
import { startMedicationScheduler } from './scheduler/medication.js';
import { startEscalationScheduler } from './scheduler/escalation.js';

const port = process.env.PORT || 4000;
app.listen(port, () => logger.info({ port, sentryEnabled }, 'MatruPitru API listening'));
startMedicationScheduler();
startEscalationScheduler();
