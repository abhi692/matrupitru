import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { registerUser, createFamilyWithParent, uniquePhone } from './helpers.js';

test('family creation requires consent', async () => {
  const { token } = await registerUser();
  const res = await request(app).post('/v1/families').set('Authorization', `Bearer ${token}`).send({});
  assert.equal(res.status, 400);
});

test('buyer can create a family and add a parent', async () => {
  const { token } = await registerUser();
  const { family, parent } = await createFamilyWithParent(token);
  assert.ok(family.id);
  assert.equal(parent.familyId, family.id);
});

test('dashboard reflects the parent and is scoped to the right family', async () => {
  const { token } = await registerUser();
  const { family } = await createFamilyWithParent(token);

  const dash = await request(app).get(`/v1/families/${family.id}/dashboard`).set('Authorization', `Bearer ${token}`);
  assert.equal(dash.status, 200);
  assert.equal(dash.body.parents.length, 1);
});

test('a buyer cannot read another family\'s dashboard', async () => {
  const { token: ownerToken } = await registerUser();
  const { family } = await createFamilyWithParent(ownerToken);

  const { token: strangerToken } = await registerUser();
  const res = await request(app).get(`/v1/families/${family.id}/dashboard`).set('Authorization', `Bearer ${strangerToken}`);
  assert.equal(res.status, 403);
});

test('sibling invite: invited phone auto-joins the family on registration', async () => {
  const { token: primaryToken } = await registerUser();
  const { family } = await createFamilyWithParent(primaryToken);

  const siblingPhone = uniquePhone('777');
  const invite = await request(app)
    .post(`/v1/families/${family.id}/invites`)
    .set('Authorization', `Bearer ${primaryToken}`)
    .send({ phone: siblingPhone });
  assert.equal(invite.status, 201);
  assert.equal(invite.body.status, 'pending');

  const { user: sibling } = await registerUser({ name: 'Sibling', phone: siblingPhone });
  assert.equal(sibling.familyId, family.id);

  const dash = await request(app).get(`/v1/families/${family.id}/dashboard`).set('Authorization', `Bearer ${primaryToken}`);
  assert.equal(dash.body.buyers.length, 2);
});
