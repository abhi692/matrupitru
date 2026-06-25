import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireRole } from '../../lib/auth.js';
import { bus } from '../../events/bus.js';
import { distanceMeters, GEO_VERIFY_RADIUS_M } from '../../lib/geo.js';
import { notifyAll } from '../../lib/notify.js';
import { omitPasswordHash } from '../../lib/sanitize.js';

export const visitRouter = Router();

// POST /v1/visits — schedule (care manager)
visitRouter.post('/visits', requireAuth, requireRole('care_manager', 'admin'), async (req, res) => {
  const { parentId, caregiverId, type, scheduledAt, taskChecklist = [] } = req.body;
  if (!parentId || !type || !scheduledAt) {
    return res.status(400).json({ error: 'parentId, type, scheduledAt required' });
  }
  const visit = await prisma.visit.create({
    data: {
      parentId,
      caregiverId,
      scheduledById: req.user.id,
      type,
      scheduledAt: new Date(scheduledAt),
      taskChecklistJson: JSON.stringify(taskChecklist.map((t) => ({ task: t, done: false }))),
      status: 'scheduled',
    },
  });
  res.status(201).json(visit);
});

// PATCH /v1/visits/:id/check-in — caregiver, body: {geo, ts}
visitRouter.patch('/visits/:id/check-in', requireAuth, requireRole('caregiver', 'admin'), async (req, res) => {
  const { lat, lng } = req.body;
  const visit = await prisma.visit.findUnique({ where: { id: req.params.id }, include: { parent: true } });
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  let geoVerified = false;
  if (lat != null && lng != null && visit.parent.geoLat != null && visit.parent.geoLng != null) {
    const dist = distanceMeters(lat, lng, visit.parent.geoLat, visit.parent.geoLng);
    geoVerified = dist <= GEO_VERIFY_RADIUS_M;
  }

  const updated = await prisma.visit.update({
    where: { id: req.params.id },
    data: {
      status: 'in_progress',
      checkInAt: new Date(),
      checkInGeoLat: lat,
      checkInGeoLng: lng,
      geoVerified,
    },
  });
  res.json(updated);
});

// PATCH /v1/visits/:id/check-out — caregiver, body: {geo, ts, checklist}
visitRouter.patch('/visits/:id/check-out', requireAuth, requireRole('caregiver', 'admin'), async (req, res) => {
  const { lat, lng, checklist, notes } = req.body;
  const visit = await prisma.visit.findUnique({ where: { id: req.params.id }, include: { parent: true } });
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  let geoVerifiedOut = visit.geoVerified;
  if (lat != null && lng != null && visit.parent.geoLat != null && visit.parent.geoLng != null) {
    const dist = distanceMeters(lat, lng, visit.parent.geoLat, visit.parent.geoLng);
    geoVerifiedOut = visit.geoVerified && dist <= GEO_VERIFY_RADIUS_M;
  }

  const updated = await prisma.visit.update({
    where: { id: req.params.id },
    data: {
      status: 'completed',
      checkOutAt: new Date(),
      checkOutGeoLat: lat,
      checkOutGeoLng: lng,
      geoVerified: geoVerifiedOut,
      taskChecklistJson: checklist ? JSON.stringify(checklist) : visit.taskChecklistJson,
      notes: notes ?? visit.notes,
    },
    include: { parent: { include: { user: true } } },
  });

  await bus.emitEvent('visit.completed', { visitId: updated.id, parentId: updated.parentId, geoVerified: updated.geoVerified });

  // Fanout per §6.1: buyer notified, parent prompted to confirm, quality flagged if not geo-verified.
  await notifyAll(updated.parent.user.phone, `Visit complete for ${updated.parent.user.name}. Check the dashboard for proof.`);
  if (!updated.geoVerified) {
    await prisma.alert.create({
      data: {
        parentId: updated.parentId,
        severity: 'warning',
        type: 'missed_visit',
        resolution: null,
      },
    });
  }

  res.json(omitPasswordHash(updated));
});

// POST /v1/visits/:id/proof — upload photo/vitals artifact
visitRouter.post('/visits/:id/proof', requireAuth, requireRole('caregiver', 'admin'), async (req, res) => {
  const { type, storageUrl, metadata = {} } = req.body;
  if (!type || !storageUrl) return res.status(400).json({ error: 'type, storageUrl required' });

  const proof = await prisma.proofArtifact.create({
    data: {
      visitId: req.params.id,
      type,
      storageUrl,
      capturedBy: req.user.id,
      metadataJson: JSON.stringify(metadata),
    },
  });
  res.status(201).json(proof);
});

// POST /v1/visits/:id/confirm — parent confirms visit happened (the independent trust signal)
visitRouter.post('/visits/:id/confirm', requireAuth, requireRole('parent', 'admin'), async (req, res) => {
  const visit = await prisma.visit.update({
    where: { id: req.params.id },
    data: { parentConfirmedAt: new Date() },
  });
  await prisma.proofArtifact.create({
    data: {
      visitId: visit.id,
      type: 'parent_confirmation',
      storageUrl: '',
      capturedBy: req.user.id,
      metadataJson: JSON.stringify({ confirmedBy: req.user.id }),
    },
  });
  res.json(visit);
});

// GET /v1/visits/:id — buyer views completed visit + proof
visitRouter.get('/visits/:id', requireAuth, async (req, res) => {
  const visit = await prisma.visit.findUnique({
    where: { id: req.params.id },
    include: { proofs: true, parent: { include: { user: true } }, caregiver: true },
  });
  if (!visit) return res.status(404).json({ error: 'Visit not found' });
  res.json(omitPasswordHash(visit));
});

// GET /v1/visits?caregiverId= — caregiver field-app assignment list
visitRouter.get('/visits', requireAuth, async (req, res) => {
  const { caregiverId } = req.query;
  const visits = await prisma.visit.findMany({
    where: caregiverId ? { caregiverId } : undefined,
    include: { parent: { include: { user: true } } },
    orderBy: { scheduledAt: 'asc' },
  });
  res.json(omitPasswordHash(visits));
});
