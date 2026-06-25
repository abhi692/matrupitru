import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/db.js';
import { requireAuth, requireOwnFamily } from '../../lib/auth.js';
import { omitPasswordHash } from '../../lib/sanitize.js';

export const familyRouter = Router();

// POST /v1/families — create family + buyer (the onboarding entry point, §5)
familyRouter.post('/families', requireAuth, async (req, res) => {
  const { billingCurrency = 'USD' } = req.body;
  const family = await prisma.family.create({
    data: { primaryBuyerId: req.user.id, billingCurrency },
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
      name, phone, password = 'changeme123', dob, address, geoLat, geoLng,
      languages = [], mobilityLevel, techComfort, conditions = [], allergies = [],
      medications = [], emergencyContacts = [], preferredHospital, notes,
    } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ error: 'name, phone, address required' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const parentUser = await prisma.user.create({
      data: { name, phone, role: 'parent', passwordHash, familyId: req.params.id },
    });

    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        familyId: req.params.id,
        dob: dob ? new Date(dob) : null,
        address,
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

    const [upcomingVisits, recentVisits, vitals, alerts, carePlan] = await Promise.all([
      prisma.visit.findMany({
        where: { parentId: { in: parentIds }, status: { in: ['scheduled', 'enroute', 'in_progress'] } },
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      }),
      prisma.visit.findMany({
        where: { parentId: { in: parentIds }, status: 'completed' },
        orderBy: { checkOutAt: 'desc' },
        take: 10,
        include: { proofs: true },
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
    ]);

    res.json(omitPasswordHash({ parents, carePlan, upcomingVisits, recentVisits, vitals, openAlerts: alerts }));
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
