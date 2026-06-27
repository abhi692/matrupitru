import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/db.js';

test('register then login with the same credentials succeeds', async () => {
  const phone = '+19990000001';
  const reg = await request(app).post('/v1/auth/register').send({
    name: 'Test Buyer', phone, password: 'password123',
  });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal(reg.body.user.passwordHash, undefined);

  const login = await request(app).post('/v1/auth/login').send({ phone, password: 'password123' });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
});

test('login with wrong password is rejected', async () => {
  const phone = '+19990000002';
  await request(app).post('/v1/auth/register').send({ name: 'Test User', phone, password: 'password123' });

  const res = await request(app).post('/v1/auth/login').send({ phone, password: 'wrong' });
  assert.equal(res.status, 401);
});

test('duplicate phone registration is rejected', async () => {
  const phone = '+19990000003';
  await request(app).post('/v1/auth/register').send({ name: 'First', phone, password: 'password123' });
  const second = await request(app).post('/v1/auth/register').send({ name: 'Second', phone, password: 'password123' });
  assert.equal(second.status, 409);
});

test('/v1/me requires a bearer token', async () => {
  const res = await request(app).get('/v1/me');
  assert.equal(res.status, 401);
});

test('/v1/me returns the authenticated user', async () => {
  const phone = '+19990000004';
  const reg = await request(app).post('/v1/auth/register').send({ name: 'Me Test', phone, password: 'password123' });
  const res = await request(app).get('/v1/me').set('Authorization', `Bearer ${reg.body.token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.phone, phone);
});

test('public self-signup always creates a buyer, ignoring any role in the body', async () => {
  const phone = '+19990000005';
  const reg = await request(app).post('/v1/auth/register').send({
    name: 'Sneaky Admin', phone, password: 'password123', role: 'admin',
  });
  assert.equal(reg.status, 201);
  assert.equal(reg.body.user.role, 'buyer');
});

test('registration rejects a password shorter than 8 characters', async () => {
  const res = await request(app).post('/v1/auth/register').send({
    name: 'Short Pass', phone: '+19990000006', password: 'short',
  });
  assert.equal(res.status, 400);
});

test('registration rejects a malformed phone number', async () => {
  const res = await request(app).post('/v1/auth/register').send({
    name: 'Bad Phone', phone: 'not-a-phone', password: 'password123',
  });
  assert.equal(res.status, 400);
});

test('OTP login: request then verify with the real code logs the user in', async () => {
  const phone = '+19990000007';
  await request(app).post('/v1/auth/register').send({ name: 'Otp User', phone, password: 'password123' });

  const requestRes = await request(app).post('/v1/auth/otp/request').send({ phone });
  assert.equal(requestRes.status, 200);

  const otp = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
  assert.ok(otp);

  const verifyRes = await request(app).post('/v1/auth/otp/verify').send({ phone, code: otp.code });
  assert.equal(verifyRes.status, 200);
  assert.ok(verifyRes.body.token);
});

test('OTP code is single-use', async () => {
  const phone = '+19990000008';
  await request(app).post('/v1/auth/register').send({ name: 'Otp Reuse', phone, password: 'password123' });
  await request(app).post('/v1/auth/otp/request').send({ phone });
  const otp = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });

  const first = await request(app).post('/v1/auth/otp/verify').send({ phone, code: otp.code });
  assert.equal(first.status, 200);

  const second = await request(app).post('/v1/auth/otp/verify').send({ phone, code: otp.code });
  assert.equal(second.status, 401);
});

test('OTP request for an unknown phone returns 404, not a code', async () => {
  const res = await request(app).post('/v1/auth/otp/request').send({ phone: '+19990000099' });
  assert.equal(res.status, 404);
});

test('OTP request is rate-limited (resend cooldown)', async () => {
  const phone = '+19990000009';
  await request(app).post('/v1/auth/register').send({ name: 'Otp Cooldown', phone, password: 'password123' });
  const first = await request(app).post('/v1/auth/otp/request').send({ phone });
  assert.equal(first.status, 200);
  const second = await request(app).post('/v1/auth/otp/request').send({ phone });
  assert.equal(second.status, 429);
});
