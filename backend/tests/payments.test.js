import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser, createFamilyWithParent } from './helpers.js';

// No RAZORPAY_KEY_ID/STRIPE_SECRET_KEY in the test environment (see scripts/run-tests.js),
// so these exercise the graceful mock-success fallback path — the same path local
// dev uses without any gateway keys configured.

test('payment intent without gateway keys falls back to mock success', async () => {
  const { token } = await registerUser();
  const { family } = await createFamilyWithParent(token);

  const res = await request(app)
    .post('/v1/payments/intent')
    .set('Authorization', `Bearer ${token}`)
    .send({ familyId: family.id, amount: 500, currency: 'INR' });
  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'succeeded');
  assert.equal(res.body.provider, null);
  assert.ok(res.body.gatewayRef.startsWith('mock_'));
});

test('repeating the same Idempotency-Key returns the original payment, not a duplicate', async () => {
  const { token } = await registerUser();
  const { family } = await createFamilyWithParent(token);
  const key = `test-${Date.now()}`;

  const first = await request(app)
    .post('/v1/payments/intent')
    .set('Authorization', `Bearer ${token}`)
    .set('Idempotency-Key', key)
    .send({ familyId: family.id, amount: 250, currency: 'INR' });
  const second = await request(app)
    .post('/v1/payments/intent')
    .set('Authorization', `Bearer ${token}`)
    .set('Idempotency-Key', key)
    .send({ familyId: family.id, amount: 250, currency: 'INR' });

  assert.equal(first.body.id, second.body.id);
});

test('video session without DAILY_API_KEY returns a clear 503, not a fake room', async () => {
  const { token } = await registerUser();
  const { family } = await createFamilyWithParent(token);

  const res = await request(app)
    .post(`/v1/families/${family.id}/video-sessions`)
    .set('Authorization', `Bearer ${token}`)
    .send({});
  assert.equal(res.status, 503);
});

test('admin integrations status reports every optional gateway as mocked in the test env', async () => {
  const { token } = await registerUser({ role: 'admin' });
  const res = await request(app).get('/v1/admin/integrations').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  for (const key of ['razorpay', 'stripe', 'video', 'whatsapp', 'ai']) {
    assert.equal(res.body[key], false, `${key} should be reported as not configured`);
  }
});
