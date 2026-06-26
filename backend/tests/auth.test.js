import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

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
