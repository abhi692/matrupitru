import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireOwnFamily } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';

export const familyRouter = Router();

// POST /v1/families — create family + buyer (the onboarding entry point, §5)
// DPDP-style consent: buyer must explicitly accept before a family record (and any
// downstream PII) is created — `consent: true` is required, not just recorded.
familyRouter.post('/families', requireAuth, async (req, res) => {
  const { billingCurrency = 'USD', consent } = req.body;
  if (!consent) {
    return res.status(400).json({ error: 'consent is required to create a family record' });
  }
  const family = await prisma.family.create({
    data: { primaryBuyerId: req.user.id, billingCurrency, consentAt: new Date() },
  });
  await prisma.user.update({ where: { id: req.user.id }, data: { familyId: family.id } });
  res.status(201).json(family);
});

// POST /v1/families/:id/parents — add a parent profile
familyRouter.post(
  '/families/:id/parents',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const {
      name, phone, password = 'changeme123', dob, address, city, geoLat, geoLng,
      languages = [], mobilityLevel, techComfort, conditions = [], allergies = [],
      medications = [], emergencyContacts = [], preferredHospital, notes, locale,
    } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'name, phone, address required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parentUser = await prisma.user.create({
      data: { name, phone, role: 'parent', passwordHash, familyId: req.params.id, locale: locale || 'en' },
    });

    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        familyId: req.params.id,
        dob: dob ? new Date(dob) : null,
        address,
        city,
        geoLat,
        geoLng,
        languagesJson: JSON.stringify(languages),
        mobilityLevel,
        techComfort,
        conditionsJson: JSON.stringify(conditions),
        allergiesJson: JSON.stringify(allergies),
        medicationsJson: JSON.stringify(medications),
        emergencyContactsJson: JSON.stringify(emergencyContacts),
        preferredHospital,
        notes,
        consentAt: new Date(),
      },
    });
    res.status(201).json(parent);
  }
);

// POST /v1/families/:id/care-plan — choose/configure plan
familyRouter.post(
  '/families/:id/care-plan',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const { tier = 'standard', recurringServices = [], careManagerId } = req.body;
    const plan = await prisma.carePlan.upsert({
      where: { familyId: req.params.id },
      create: {
        familyId: req.params.id,
        tier,
        recurringServicesJson: JSON.stringify(recurringServices),
        careManagerId,
      },
      update: {
        tier,
        recurringServicesJson: JSON.stringify(recurringServices),
        careManagerId,
      },
    });
    res.status(201).json(plan);
  }
);

// GET /v1/families/:id/dashboard — aggregated buyer view (§5, §3 event-driven fanout target)
familyRouter.get(
  '/families/:id/dashboard',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const familyId = req.params.id;
    const parents = await prisma.parent.findMany({
      where: { familyId },
      include: { user: true },
    });
    const parentIds = parents.map((p) => p.id);

    const [upcomingVisits, recentVisits, vitals, alerts, carePlan, buyers] = await Promise.all([
      prisma.visit.findMany({
        where: { parentId: { in: parentIds }, status: { in: ['scheduled', 'enroute', 'in_progress'] } },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      prisma.visit.findMany({
        where: { parentId: { in: parentIds }, status: 'completed' },
        orderBy: { checkOutAt: 'desc' },
        take: 10,
        include: { proofs: true, caregiver: { include: { caregiverProfile: true } } },
      }),
      prisma.vitalsReading.findMany({
        where: { parentId: { in: parentIds } },
        orderBy: { recordedAt: 'desc' },
        take: 20,
      }),
      prisma.alert.findMany({
        where: { parentId: { in: parentIds }, acknowledgedAt: null },
        orderBy: { triggeredAt: 'desc' },
      }),
      prisma.carePlan.findUnique({ where: { familyId } }),
      prisma.user.findMany({ where: { familyId, role: 'buyer' } }),
    ]);

    res.json(omitPasswordHash({ parents, carePlan, upcomingVisits, recentVisits, vitals, openAlerts: alerts, buyers }));
  }
);

// PATCH /v1/parents/:id — update parent profile fields
familyRouter.patch('/parents/:id', requireAuth, async (req, res) => {
  const {
    address, city, geoLat, geoLng, languages, mobilityLevel, techComfort,
    conditions, allergies, medications, emergencyContacts, preferredHospital, notes,
  } = req.body;

  const data = {};
  if (address !== undefined) data.address = address;
  if (city !== undefined) data.city = city;
  if (geoLat !== undefined) data.geoLat = geoLat;
  if (geoLng !== undefined) data.geoLng = geoLng;
  if (languages !== undefined) data.languagesJson = JSON.stringify(languages);
  if (mobilityLevel !== undefined) data.mobilityLevel = mobilityLevel;
  if (techComfort !== undefined) data.techComfort = techComfort;
  if (conditions !== undefined) data.conditionsJson = JSON.stringify(conditions);
  if (allergies !== undefined) data.allergiesJson = JSON.stringify(allergies);
  if (medications !== undefined) data.medicationsJson = JSON.stringify(medications);
  if (emergencyContacts !== undefined) data.emergencyContactsJson = JSON.stringify(emergencyContacts);
  if (preferredHospital !== undefined) data.preferredHospital = preferredHospital;
  if (notes !== undefined) data.notes = notes;

  const parent = await prisma.parent.update({ where: { id: req.params.id }, data });
  res.json(parent);
});

// POST /v1/families/:id/invites — invite a sibling to share access to this
// family instead of MatruPitru only supporting one buyer (§ PM review: Indian
// families routinely have 2-3 adult children who all want visibility).
familyRouter.post(
  '/families/:id/invites',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing?.familyId === req.params.id) {
      return res.status(400).json({ error: 'This person already has access to this family.' });
    }

    const invite = await prisma.familyInvite.create({
      data: { familyId: req.params.id, phone, invitedBy: req.user.id },
    });
    res.status(201).json(invite);
  }
);

// GET /v1/families/:id/invites — pending/accepted invites for this family
familyRouter.get(
  '/families/:id/invites',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const invites = await prisma.familyInvite.findMany({
      where: { familyId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invites);
  }
);

// GET /v1/invites/pending?phone= — used by the registration/login flow to
// check if a phone number has a waiting family invite.
familyRouter.get('/invites/pending', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const invite = await prisma.familyInvite.findFirst({
    where: { phone, status: 'pending' },
    include: { family: { include: { users: true } } },
  });
  if (!invite) return res.json(null);
  res.json({ id: invite.id, familyName: invite.family.users.find((u) => u.role === 'buyer')?.name });
});

// POST /v1/invites/:id/accept — the invited sibling accepts; links their
// (already-authenticated) account to the family as a co-buyer.
familyRouter.post('/invites/:id/accept', requireAuth, async (req, res) => {
  const invite = await prisma.familyInvite.findUnique({ where: { id: req.params.id } });
  if (!invite || invite.status !== 'pending') return res.status(404).json({ error: 'Invite not found or already used' });
  if (invite.phone !== req.user.phone) return res.status(403).json({ error: 'This invite is for a different phone number' });

  await prisma.user.update({ where: { id: req.user.id }, data: { familyId: invite.familyId, role: 'buyer' } });
  await prisma.familyInvite.update({ where: { id: invite.id }, data: { status: 'accepted', acceptedAt: new Date() } });
  res.json({ familyId: invite.familyId });
});

// GET /v1/families/:id/timeline — a single chronological narrative feed instead
// of separate dashboard widgets (§ PM review: a buyer wants "what happened with
// my parent" as a story, not six disconnected panels they have to mentally merge).
familyRouter.get(
  '/families/:id/timeline',
  requireAuth,
  requireOwnFamily((req) => req.params.id),
  async (req, res) => {
    const familyId = req.params.id;
    const parents = await prisma.parent.findMany({ where: { familyId }, select: { id: true } });
    const parentIds = parents.map((p) => p.id);

    const [visits, vitals, alerts, medLogs, ratings] = await Promise.all([
      prisma.visit.findMany({
        where: { parentId: { in: parentIds }, status: 'completed' },
        include: { caregiver: true },
        orderBy: { checkOutAt: 'desc' },
        take: 20,
      }),
      prisma.vitalsReading.findMany({
        where: { parentId: { in: parentIds }, flagged: true },
        orderBy: { recordedAt: 'desc' },
        take: 20,
      }),
      prisma.alert.findMany({
        where: { parentId: { in: parentIds } },
        orderBy: { triggeredAt: 'desc' },
        take: 20,
      }),
      prisma.medicationLog.findMany({
        where: { parentId: { in: parentIds }, status: { in: ['given', 'missed'] } },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      }),
      prisma.rating.findMany({
        where: { buyer: { familyId } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const events = [
      ...visits.map((v) => ({
        id: `visit-${v.id}`, at: v.checkOutAt, type: 'visit',
        summary: `${v.caregiver?.name || 'A caregiver'} completed a ${v.type} visit${v.geoVerified ? ' (geo-verified)' : ''}.`,
        meta: { visitId: v.id },
      })),
      ...vitals.map((v) => ({
        id: `vitals-${v.id}`, at: v.recordedAt, type: 'vitals_flagged',
        summary: `Flagged ${v.type.toUpperCase()} reading: ${v.value} ${v.unit}.`,
      })),
      ...alerts.map((a) => ({
        id: `alert-${a.id}`, at: a.triggeredAt, type: a.type,
        summary: a.type === 'sos' ? 'Emergency SOS was raised.' : a.type === 'med_missed' ? 'A medication dose was missed.' : `Alert: ${a.type.replace(/_/g, ' ')}.`,
        severity: a.severity,
        meta: { acknowledged: !!a.acknowledgedAt },
      })),
      ...medLogs.map((m) => ({
        id: `med-${m.id}`, at: m.scheduledAt, type: `medication_${m.status}`,
        summary: m.status === 'given' ? `${m.medication} was taken on time.` : `${m.medication} dose was missed.`,
      })),
      ...ratings.map((r) => ({
        id: `rating-${r.id}`, at: r.createdAt, type: 'rating',
        summary: `Rated a caregiver ${r.stars}/5${r.comment ? `: "${r.comment}"` : '.'}`,
      })),
    ]
      .filter((e) => e.at)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 40);

    res.json(events);
  }
);

// GET /v1/parents/:id/schedule — upcoming visits
familyRouter.get('/parents/:id/schedule', requireAuth, async (req, res) => {
  const visits = await prisma.visit.findMany({
    where: { parentId: req.params.id, status: { in: ['scheduled', 'enroute', 'in_progress'] } },
    orderBy: { scheduledAt: 'asc' },
  });
  res.json(visits);
});
