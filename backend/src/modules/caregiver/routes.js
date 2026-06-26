import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireRole } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';
import { upload, fileUrl } from '../../lib/upload.js';

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

// Real verification pipeline instead of an admin just flipping a status flag —
// the caregiver uploads police verification / ID proof / reference letters,
// each gets individually reviewed (approved/rejected with notes), matching how
// trust verification actually works for in-home care in India.

// True if the authenticated user IS the caregiver behind this profile id.
async function isOwnCaregiverProfile(req) {
  if (req.user.role !== 'caregiver') return false;
  const profile = await prisma.caregiver.findUnique({ where: { userId: req.user.id } });
  return profile?.id === req.params.id;
}

// POST /v1/caregivers/:id/documents — caregiver (or admin on their behalf) uploads a document
caregiverRouter.post('/caregivers/:id/documents', requireAuth, upload.single('file'), async (req, res) => {
  if (req.user.role !== 'admin' && !(await isOwnCaregiverProfile(req))) {
    return res.status(403).json({ error: 'Not your caregiver profile' });
  }
  const { type } = req.body;
  if (!req.file || !type) return res.status(400).json({ error: 'file and type required' });

  const doc = await prisma.caregiverDocument.create({
    data: { caregiverId: req.params.id, type, fileUrl: fileUrl(req, req.file.filename) },
  });
  res.status(201).json(doc);
});

// GET /v1/caregivers/:id/documents — caregiver's own docs, or admin/CM review queue
caregiverRouter.get('/caregivers/:id/documents', requireAuth, async (req, res) => {
  if (!['admin', 'care_manager'].includes(req.user.role) && !(await isOwnCaregiverProfile(req))) {
    return res.status(403).json({ error: 'Not your caregiver profile' });
  }
  const docs = await prisma.caregiverDocument.findMany({
    where: { caregiverId: req.params.id },
    orderBy: { uploadedAt: 'desc' },
  });
  res.json(docs);
});

// GET /v1/admin/documents?status=pending — cross-caregiver review queue for ops
caregiverRouter.get('/admin/documents', requireAuth, requireRole('admin'), async (req, res) => {
  const { status } = req.query;
  const docs = await prisma.caregiverDocument.findMany({
    where: status ? { status } : undefined,
    include: { caregiver: { include: { user: true } } },
    orderBy: { uploadedAt: 'desc' },
  });
  res.json(omitPasswordHash(docs));
});

// PATCH /v1/admin/documents/:id/review — approve/reject a single document
caregiverRouter.patch('/admin/documents/:id/review', requireAuth, requireRole('admin'), async (req, res) => {
  const { status, notes } = req.body;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });

  const doc = await prisma.caregiverDocument.update({
    where: { id: req.params.id },
    data: { status, notes, reviewedById: req.user.id, reviewedAt: new Date() },
  });
  res.json(doc);
});
