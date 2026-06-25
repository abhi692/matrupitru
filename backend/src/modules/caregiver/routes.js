import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireRole } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';

export const caregiverRouter = Router();

// GET /v1/caregivers — admin/care-manager roster view
caregiverRouter.get('/caregivers', requireAuth, requireRole('care_manager', 'admin'), async (req, res) => {
  const caregivers = await prisma.caregiver.findMany({ include: { user: true } });
  res.json(omitPasswordHash(caregivers));
});

// GET /v1/families — care manager roster of families they manage
caregiverRouter.get('/families', requireAuth, requireRole('care_manager', 'admin'), async (req, res) => {
  const families = await prisma.family.findMany({
    include: { parents: { include: { user: true } }, carePlan: true, users: true },
  });
  res.json(omitPasswordHash(families));
});
