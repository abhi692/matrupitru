import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser, createFamilyWithParent } from './helpers.js';

test('raising SOS creates an emergency alert with escalationLevel 0', async () => {
  const { token: buyerToken } = await registerUser();
  const { parent } = await createFamilyWithParent(buyerToken);

  const res = await request(app).post(`/v1/parents/${parent.id}/sos`).set('Authorization', `Bearer ${buyerToken}`).send({});
  assert.equal(res.status, 201);
  assert.equal(res.body.alert.severity, 'emergency');
  assert.equal(res.body.alert.escalationLevel, 0);
  assert.equal(res.body.alert.acknowledgedAt, null);
});

test('the alert feed for a family only returns its own parent\'s alerts', async () => {
  const { token: buyerToken } = await registerUser();
  const { family, parent } = await createFamilyWithParent(buyerToken);
  await request(app).post(`/v1/parents/${parent.id}/sos`).set('Authorization', `Bearer ${buyerToken}`).send({});

  const { token: otherToken } = await registerUser();
  const { family: otherFamily, parent: otherParent } = await createFamilyWithParent(otherToken);
  await request(app).post(`/v1/parents/${otherParent.id}/sos`).set('Authorization', `Bearer ${otherToken}`).send({});

  const res = await request(app).get(`/v1/alerts?family=${family.id}`).set('Authorization', `Bearer ${buyerToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.every((a) => a.parentId === parent.id));
  assert.notEqual(res.body.length, 0);
});

test('acknowledging an alert sets acknowledgedAt and acknowledgedById', async () => {
  const { token: buyerToken } = await registerUser();
  const { parent } = await createFamilyWithParent(buyerToken);
  const sos = await request(app).post(`/v1/parents/${parent.id}/sos`).set('Authorization', `Bearer ${buyerToken}`).send({});

  const { token: cmToken, user: cmUser } = await registerUser({ role: 'care_manager' });
  const ack = await request(app)
    .patch(`/v1/alerts/${sos.body.alert.id}/acknowledge`)
    .set('Authorization', `Bearer ${cmToken}`)
    .send({ resolution: 'False alarm' });
  assert.equal(ack.status, 200);
  assert.ok(ack.body.acknowledgedAt);
  assert.equal(ack.body.acknowledgedById, cmUser.id);
});
