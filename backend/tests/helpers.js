import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/db.js';
import { signToken } from '../src/lib/auth.js';

let counter = 0;
export function uniquePhone(prefix = '999') {
  counter += 1;
  return `+1${prefix}${String(Date.now()).slice(-6)}${counter}`;
}

// Buyers go through the real public /auth/register endpoint (that's what
// we're testing). Other roles (care_manager/caregiver/admin) are provisioned
// directly, same as the seed script — the public endpoint deliberately can't
// create them (self-signup is buyer-only; see lib/notes in identity routes).
export async function registerUser({ name = 'Test User', phone, password = 'password123', role = 'buyer' } = {}) {
  const p = phone || uniquePhone();
  if (role === 'buyer') {
    const res = await request(app).post('/v1/auth/register').send({ name, phone: p, password });
    if (res.status !== 201) throw new Error(`registerUser failed: ${JSON.stringify(res.body)}`);
    return res.body; // { token, user }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, phone: p, role, passwordHash } });
  return { token: signToken(user), user };
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
