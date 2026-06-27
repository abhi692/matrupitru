import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db.js';
import { signToken, requireAuth } from '../../lib/auth.js';

export const identityRouter = Router();

const PHONE_RE = /^\+?[0-9]{8,15}$/;

// Public self-signup. Demo-grade auth (phone + password, no OTP/SSO — out of
// scope for Phase 1) but the role is NOT trusted from the client: this is now
// a public, unauthenticated endpoint, so a `role` field in the request body
// could otherwise be used to mint an admin/caregiver/care_manager account.
// Self-signup only ever creates buyers; every other role is provisioned
// internally (seed script today, an admin-only endpoint if that's ever needed).
identityRouter.post('/auth/register', async (req, res) => {
  const { name, phone, password, email, locale, timezone } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'name, phone, password required' });
  }
  if (!PHONE_RE.test(phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number, e.g. +919900000000' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return res.status(409).json({ error: 'Phone already registered' });

  const passwordHash = await bcrypt.hash(password, 10);

  // Auto-link to a family if a sibling already invited this phone number —
  // registering and joining an existing family should be one step, not two.
  const pendingInvite = await prisma.familyInvite.findFirst({ where: { phone, status: 'pending' } });

  const user = await prisma.user.create({
    data: {
      name, phone, email, role: 'buyer', passwordHash, locale, timezone,
      familyId: pendingInvite?.familyId,
    },
  });

  if (pendingInvite) {
    await prisma.familyInvite.update({ where: { id: pendingInvite.id }, data: { status: 'accepted', acceptedAt: new Date() } });
  }

  res.status(201).json({ token: signToken(user), user: safeUser(user) });
});

identityRouter.post('/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const caregiverProfile = await prisma.caregiver.findUnique({ where: { userId: user.id } });
  res.json({ token: signToken(user), user: { ...safeUser(user), caregiverId: caregiverProfile?.id || null } });
});

identityRouter.get('/me', requireAuth, async (req, res) => {
  const caregiverProfile = await prisma.caregiver.findUnique({ where: { userId: req.user.id } });
  res.json({ ...safeUser(req.user), caregiverId: caregiverProfile?.id || null });
});

// PATCH /v1/me/push-token — called by the mobile app once it has a real Expo
// push token, so server-side events (SOS, alerts, medication reminders) can
// reach the device instantly instead of only on next app-open poll.
identityRouter.patch('/me/push-token', requireAuth, async (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ error: 'pushToken required' });
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { pushToken } });
  res.json(safeUser(user));
});

function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}
