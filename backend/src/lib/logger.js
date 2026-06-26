import pino from 'pino';

// Structured JSON logging instead of scattered console.log calls — every line
// is greppable/queryable by a real log aggregator (Datadog, CloudWatch, etc.)
// without any code change on our side. Pretty-printed in dev for readability.
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
  },
});
