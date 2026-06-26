import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// Tests run against a real, fresh SQLite database (not the dev one) — same
// schema, same Prisma client code path, just disposable. Cheaper than mocking
// the ORM and catches real query bugs the dev/seed data wouldn't surface.
const testDbPath = path.resolve('prisma/test.db');
if (fs.existsSync(testDbPath)) fs.rmSync(testDbPath);

const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: `file:${testDbPath}`,
  JWT_SECRET: 'test-secret',
  // Force every optional integration into its mock/fallback path during tests —
  // we're verifying our own logic, not hitting real Razorpay/Stripe/Daily/Anthropic APIs.
  RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', STRIPE_SECRET_KEY: '',
  DAILY_API_KEY: '', ANTHROPIC_API_KEY: '', WHATSAPP_BUSINESS_TOKEN: '', WHATSAPP_PHONE_NUMBER_ID: '',
};

execSync('npx prisma db push --accept-data-loss --skip-generate', { env, stdio: 'inherit' });

const result = spawnSync('node', ['--test', 'tests/'], { env, stdio: 'inherit' });
process.exit(result.status ?? 1);
