import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';

export const commsRouter = Router();

// GET /v1/families/:id/thread — get-or-create the single buyer<->care-manager
// thread for a family. One thread per family keeps this simple for Phase 1.
commsRouter.get('/families/:id/thread', requireAuth, async (req, res) => {
  let thread = await prisma.thread.findFirst({ where: { familyId: req.params.id } });
  if (!thread) {
    thread = await prisma.thread.create({ data: { familyId: req.params.id } });
  }
  res.status(201).json(thread);
});

// GET /v1/threads — care manager's list of active conversations across families
commsRouter.get('/threads', requireAuth, async (req, res) => {
  const threads = await prisma.thread.findMany({
    include: {
      family: { include: { users: true, parents: { include: { user: true } } } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(omitPasswordHash(threads));
});

commsRouter.post('/threads/:id/messages', requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body required' });
  const message = await prisma.message.create({
    data: { threadId: req.params.id, senderId: req.user.id, body },
    include: { sender: true },
  });
  res.status(201).json(omitPasswordHash(message));
});

commsRouter.get('/threads/:id/messages', requireAuth, async (req, res) => {
  const messages = await prisma.message.findMany({
    where: { threadId: req.params.id },
    include: { sender: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(omitPasswordHash(messages));
});
