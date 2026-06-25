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

// POST /v1/threads/{id}/messages — buyer <-> care manager chat
caregiverRouter.post('/threads/:id/messages', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body required' });
  const message = await prisma.message.create({
    data: { threadId: req.params.id, senderId: req.user.id, body },
  });
  res.status(201).json(message);
});

caregiverRouter.get('/threads/:id/messages', requireAuth, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { threadId: req.params.id },
    include: { sender: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(omitPasswordHash(messages));
});

caregiverRouter.post('/threads', requireAuth, async (req, res) => {
  const { familyId } = req.body;
  const thread = await prisma.thread.create({ data: { familyId } });
  res.status(201).json(thread);
});
