import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db.js';
import { signToken, requireAuth } from '../../lib/auth.js';

export const identityRouter = Router();

// Demo-grade auth: phone + password. Real OTP/SSO is out of scope for Phase 1 local build.
identityRouter.post('/auth/register', async (req, res) => {
  const { name, phone, password, role = 'buyer', email, locale, timezone } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'name, phone, password required' });
  }
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ error: 'Phone already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, phone, email, role, passwordHash, locale, timezone },
  });
  res.status(201).json({ token: signToken(user), user: safeUser(user) });
});

identityRouter.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({ token: signToken(user), user: safeUser(user) });
});

identityRouter.get('/me', requireAuth, (req, res) => {
  res.json(safeUser(req.user));
});

function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}
