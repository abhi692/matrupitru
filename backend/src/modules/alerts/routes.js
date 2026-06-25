import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { bus } from '../../events/bus.js';
import { notifyAll, notify } from '../../lib/notify.js';

export const alertsRouter = Router();

// Finds the nearest available, verified caregiver covering the parent's city —
// the "dispatch nearest caregiver" half of §6.2. Falls back to city-only match
// if geo isn't set, and is best-effort (never blocks the alert itself).
async function findNearestCaregiver(parent) {
  const caregivers = await prisma.caregiver.findMany({
    where: { verificationStatus: 'verified', availability: 'available' },
    include: { user: true },
  });
  const covering = caregivers.filter((c) => {
    const cities = JSON.parse(c.serviceCitiesJson || '[]');
    return !parent.city || cities.length === 0 || cities.includes(parent.city);
  });
  if (covering.length === 0) return null;
  if (parent.geoLat == null || parent.geoLng == null) return covering[0];

  // We don't store caregiver live location in Phase 1, so "nearest" is approximated
  // by city match + rating; a real implementation would use last-known GPS ping.
  return covering.sort((a, b) => b.rating - a.rating)[0];
}

// POST /v1/parents/:id/sos — raise emergency (parent app/IVR). Dedicated high-priority
// path per §6.2: must reach a human in <60s and degrade to plain telephony.
alertsRouter.post('/parents/:id/sos', requireAuth, async (req, res) => {
  const parent = await prisma.parent.findUnique({
    where: { id: req.params.id },
    include: { family: { include: { users: true, carePlan: { include: { careManager: true } } } } },
  });
  if (!parent) return res.status(404).json({ error: 'Parent not found' });

  const alert = await prisma.alert.create({
    data: { parentId: parent.id, severity: 'emergency', type: 'sos' },
  });

  await bus.emitEvent('sos.raised', { alertId: alert.id, parentId: parent.id });

  const careManager = parent.family.carePlan?.careManager;
  const buyers = parent.family.users.filter((u) => u.role === 'buyer');
  const dispatchedCaregiver = await findNearestCaregiver(parent);

  // Simultaneous call+push+SMS to Care Manager/backup, then buyer notification, per §6.2.
  if (careManager) {
    await notify('call', careManager.phone, `SOS for ${parent.address}`);
    await notifyAll(careManager.phone, `SOS raised for parent ${parent.id}`);
  }
  for (const buyer of buyers) {
    await notifyAll(buyer.phone, `Emergency SOS raised for your parent. Care Manager has been notified.`);
  }
  if (dispatchedCaregiver) {
    await notify('call', dispatchedCaregiver.user.phone, `Dispatch: nearest caregiver needed for SOS at ${parent.address}`);
  }
  if (parent.preferredHospital) {
    await notify('call', 'hospital-desk', `Standby notice: possible incoming patient — ${parent.preferredHospital}`);
  }

  res.status(201).json({
    alert,
    notified: { careManager: !!careManager, buyers: buyers.length },
    dispatchedCaregiver: dispatchedCaregiver ? { id: dispatchedCaregiver.userId, name: dispatchedCaregiver.user.name } : null,
    preferredHospitalNotified: !!parent.preferredHospital,
  });
});

// GET /v1/alerts?family={id} — alert feed
alertsRouter.get('/alerts', requireAuth, async (req, res) => {
  const { family } = req.query;
  let parentIds;
  if (family) {
    const parents = await prisma.parent.findMany({ where: { familyId: family }, select: { id: true } });
    parentIds = parents.map((p) => p.id);
  }
  const alerts = await prisma.alert.findMany({
    where: parentIds ? { parentId: { in: parentIds } } : undefined,
    orderBy: { triggeredAt: 'desc' },
  });
  res.json(alerts);
});

// PATCH /v1/alerts/:id/acknowledge — care manager triage
alertsRouter.patch('/alerts/:id/acknowledge', requireAuth, async (req, res) => {
  const { resolution } = req.body;
  const alert = await prisma.alert.update({
    where: { id: req.params.id },
    data: { acknowledgedById: req.user.id, acknowledgedAt: new Date(), resolution },
  });
  res.json(alert);
});
