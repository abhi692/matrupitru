import request from 'supertest';
import { app } from '../src/app.js';

let counter = 0;
export function uniquePhone(prefix = '999') {
  counter += 1;
  return `+1${prefix}${String(Date.now()).slice(-6)}${counter}`;
}

export async function registerUser({ name = 'Test User', phone, password = 'password123', role = 'buyer' } = {}) {
  const res = await request(app).post('/v1/auth/register').send({ name, phone: phone || uniquePhone(), password, role });
  if (res.status !== 201) throw new Error(`registerUser failed: ${JSON.stringify(res.body)}`);
  return res.body; // { token, user }
}

export async function createFamilyWithParent(buyerToken) {
  const family = await request(app).post('/v1/families').set('Authorization', `Bearer ${buyerToken}`).send({ consent: true });
  if (family.status !== 201) throw new Error(`createFamily failed: ${JSON.stringify(family.body)}`);

  const parent = await request(app)
    .post(`/v1/families/${family.body.id}/parents`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ name: 'Test Parent', phone: uniquePhone('888'), address: '1 Test St', city: 'Hubli' });
  if (parent.status !== 201) throw new Error(`createParent failed: ${JSON.stringify(parent.body)}`);

  return { family: family.body, parent: parent.body };
}
