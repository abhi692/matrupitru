import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/db.js';
import { registerUser, createFamilyWithParent, uniquePhone } from './helpers.js';

async function makeCaregiver() {
  const { token, user } = await registerUser({ name: 'Test Caregiver', phone: uniquePhone('666'), role: 'caregiver' });
  const caregiver = await prisma.caregiver.create({
    data: { userId: user.id, verificationStatus: 'verified', availability: 'available' },
  });
  return { token, user, caregiver };
}

test('full visit lifecycle: schedule -> check-in -> check-out -> rate', async () => {
  const { token: buyerToken } = await registerUser();
  const { parent } = await createFamilyWithParent(buyerToken);
  const { token: cmToken } = await registerUser({ role: 'care_manager' });
  const { token: caregiverToken, user: caregiverUser, caregiver } = await makeCaregiver();

  const visit = await request(app)
    .post('/v1/visits')
    .set('Authorization', `Bearer ${cmToken}`)
    .send({ parentId: parent.id, caregiverId: caregiverUser.id, type: 'attendant', scheduledAt: new Date().toISOString() });
  assert.equal(visit.status, 201);
  assert.equal(visit.body.status, 'scheduled');

  const checkIn = await request(app)
    .patch(`/v1/visits/${visit.body.id}/check-in`)
    .set('Authorization', `Bearer ${caregiverToken}`)
    .send({});
  assert.equal(checkIn.status, 200);
  assert.equal(checkIn.body.status, 'in_progress');

  const checkOut = await request(app)
    .patch(`/v1/visits/${visit.body.id}/check-out`)
    .set('Authorization', `Bearer ${caregiverToken}`)
    .send({ checklist: [] });
  assert.equal(checkOut.status, 200);
  assert.equal(checkOut.body.status, 'completed');

  const rating = await request(app)
    .post(`/v1/visits/${visit.body.id}/rating`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ stars: 5, comment: 'Excellent care' });
  assert.equal(rating.status, 201);
  assert.equal(rating.body.stars, 5);

  const updatedCaregiver = await prisma.caregiver.findUnique({ where: { id: caregiver.id } });
  assert.equal(updatedCaregiver.ratingCount, 1);
  assert.equal(updatedCaregiver.rating, 5);
});

test('rating a visit that is not completed is rejected', async () => {
  const { token: buyerToken } = await registerUser();
  const { parent } = await createFamilyWithParent(buyerToken);
  const { token: cmToken } = await registerUser({ role: 'care_manager' });
  const { user: caregiverUser } = await makeCaregiver();

  const visit = await request(app)
    .post('/v1/visits')
    .set('Authorization', `Bearer ${cmToken}`)
    .send({ parentId: parent.id, caregiverId: caregiverUser.id, type: 'attendant', scheduledAt: new Date().toISOString() });

  const rating = await request(app)
    .post(`/v1/visits/${visit.body.id}/rating`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ stars: 5 });
  assert.equal(rating.status, 400);
});

test('rating with an out-of-range star value is rejected', async () => {
  const { token: buyerToken } = await registerUser();
  const { parent } = await createFamilyWithParent(buyerToken);
  const { token: cmToken } = await registerUser({ role: 'care_manager' });
  const { token: caregiverToken, user: caregiverUser } = await makeCaregiver();

  const visit = await request(app)
    .post('/v1/visits')
    .set('Authorization', `Bearer ${cmToken}`)
    .send({ parentId: parent.id, caregiverId: caregiverUser.id, type: 'attendant', scheduledAt: new Date().toISOString() });
  await request(app).patch(`/v1/visits/${visit.body.id}/check-in`).set('Authorization', `Bearer ${caregiverToken}`).send({});
  await request(app).patch(`/v1/visits/${visit.body.id}/check-out`).set('Authorization', `Bearer ${caregiverToken}`).send({ checklist: [] });

  const rating = await request(app)
    .post(`/v1/visits/${visit.body.id}/rating`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ stars: 7 });
  assert.equal(rating.status, 400);
});
