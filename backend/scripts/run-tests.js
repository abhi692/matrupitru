import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

// Tests run against a real, fresh SQLite database (not the dev one) — same
// schema, same Prisma client code path, just disposable. Cheaper than mocking
// the ORM and catches real query bugs the dev/seed data wouldn't surface.
// A uniquely-named file per run instead of deleting/reusing a fixed test.db —
// on Windows a previous (possibly still-running, e.g. backgrounded) test
// process can hold the old file locked, and reusing it silently carries over
// stale rows that collide with this run's fixed-phone-number test fixtures.
const testDbPath = path.resolve(`prisma/test-${process.pid}-${Date.now()}.db`);

// Best-effort cleanup of old test-*.db files from previous runs.
try {
  for (const f of fs.readdirSync(path.resolve('prisma'))) {
    if (/^test-\d+-\d+\.db$/.test(f)) fs.rmSync(path.resolve('prisma', f));
  }
} catch {
  // leftover locked files just accumulate harmlessly; not worth failing the run over
}

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
