import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireOwnFamily } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';
import { videoEnabled, createDailyRoom } from '../../lib/video.js';

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

// POST /v1/families/:id/video-sessions — start a "see your parent" video call.
// The highest-emotional-ROI gap for remote adult children: a real face-to-face
// check-in, not just a text/photo proof of care. Without DAILY_API_KEY set,
// returns a clear 503 — no fake room URL that would silently fail to load.
commsRouter.post(
  '/families/:id/video-sessions',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    if (!videoEnabled) {
      return res.status(503).json({ error: 'Video calling is not configured. Set DAILY_API_KEY to enable it.' });
    }
    const { visitId } = req.body;
    const roomName = `mp-${req.params.id.slice(0, 8)}-${uuid().slice(0, 8)}`;
    const room = await createDailyRoom({ name: roomName });
    const session = await prisma.videoSession.create({
      data: {
        familyId: req.params.id,
        visitId,
        roomName: room.name,
        roomUrl: room.url,
        createdBy: req.user.id,
        expiresAt: room.config?.exp ? new Date(room.config.exp * 1000) : null,
      },
    });
    res.status(201).json(session);
  }
);

commsRouter.get(
  '/families/:id/video-sessions',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const sessions = await prisma.videoSession.findMany({
      where: { familyId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(sessions);
  }
);
