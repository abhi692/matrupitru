import * as Sentry from '@sentry/node';

// Optional error tracking — gated behind SENTRY_DSN like the other third-party
// integrations. Without it set, errors just go to the structured logger;
// nothing in the app needs to know whether Sentry is actually wired up.
export const sentryEnabled = Boolean(process.env.SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

export function captureException(err) {
  if (sentryEnabled) Sentry.captureException(err);
}

export { Sentry };
