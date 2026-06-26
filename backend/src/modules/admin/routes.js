import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireRole } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';
import { razorpayEnabled, stripeEnabled } from '../../lib/payments.js';
import { videoEnabled } from '../../lib/video.js';
import { whatsappEnabled } from '../../lib/whatsapp.js';

export const adminRouter = Router();

// GET /v1/admin/integrations — which optional third-party gateways are live vs.
// mocked, at a glance, instead of an ops person having to check env vars by hand.
adminRouter.get('/admin/integrations', requireAuth, requireRole('admin'), (req, res) => {
  res.json({
    razorpay: razorpayEnabled,
    stripe: stripeEnabled,
    video: videoEnabled,
    whatsapp: whatsappEnabled,
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    sentry: Boolean(process.env.SENTRY_DSN),
  });
});

// GET /v1/admin/caregivers — full roster incl. pending verification, for ops review
adminRouter.get('/admin/caregivers', requireAuth, requireRole('admin'), async (req, res) => {
  const caregivers = await prisma.caregiver.findMany({
    include: { user: true },
    orderBy: { verificationStatus: 'asc' },
  });
  res.json(omitPasswordHash(caregivers));
});

// PATCH /v1/admin/caregivers/:id/verification — approve/reject a caregiver (§1.1 admin/ops)
adminRouter.patch('/admin/caregivers/:id/verification', requireAuth, requireRole('admin'), async (req, res) => {
  const { status, backgroundCheckRef } = req.body;
  if (!['pending', 'verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be pending|verified|rejected' });
  }
  const caregiver = await prisma.caregiver.update({
    where: { id: req.params.id },
    data: { verificationStatus: status, ...(backgroundCheckRef ? { backgroundCheckRef } : {}) },
  });
  res.json(caregiver);
});

// PATCH /v1/admin/caregivers/:id/coverage — manage which cities a caregiver serves
adminRouter.patch('/admin/caregivers/:id/coverage', requireAuth, requireRole('admin'), async (req, res) => {
  const { cities = [] } = req.body;
  const caregiver = await prisma.caregiver.update({
    where: { id: req.params.id },
    data: { serviceCitiesJson: JSON.stringify(cities) },
  });
  res.json(caregiver);
});

// GET /v1/admin/sla — success metrics per §11: proof-verified visit rate, missed-visit
// rate, SOS ack time, retention proxy (active families with a visit in the last 30d).
adminRouter.get('/admin/sla', requireAuth, requireRole('admin'), async (req, res) => {
  const [totalVisits, geoVerifiedVisits, completedVisits, sosAlerts, families, recentActiveParents] = await Promise.all([
    prisma.visit.count(),
    prisma.visit.count({ where: { status: 'completed', geoVerified: true } }),
    prisma.visit.count({ where: { status: 'completed' } }),
    prisma.alert.findMany({ where: { type: 'sos' } }),
    prisma.family.count(),
    prisma.visit.findMany({
      where: { status: 'completed', checkOutAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      select: { parentId: true },
      distinct: ['parentId'],
    }),
  ]);

  const ackTimes = sosAlerts.filter((a) => a.acknowledgedAt).map((a) => (new Date(a.acknowledgedAt) - new Date(a.triggeredAt)) / 1000);
  const avgSosAckSeconds = ackTimes.length ? Math.round(ackTimes.reduce((a, b) => a + b, 0) / ackTimes.length) : null;

  const missedVisits = await prisma.visit.count({ where: { status: 'completed', geoVerified: false } });

  res.json({
    totalVisits,
    completedVisits,
    geoVerifiedRate: completedVisits ? Math.round((geoVerifiedVisits / completedVisits) * 100) : null,
    missedVisitRate: completedVisits ? Math.round((missedVisits / completedVisits) * 100) : null,
    sosCount: sosAlerts.length,
    sosAcknowledgedCount: ackTimes.length,
    avgSosAckSeconds,
    totalFamilies: families,
    activeParents30d: recentActiveParents.length,
  });
});

// GET /v1/admin/audit — raw Event log as an audit trail (DPDP-style accountability)
adminRouter.get('/admin/audit', requireAuth, requireRole('admin'), async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(events);
});
