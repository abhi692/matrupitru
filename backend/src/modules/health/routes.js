import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { bus } from '../../events/bus.js';

export const healthRouter = Router();

// Simple threshold rules per §6.3 — flags route to Care Manager, never shown to parent as "advice".
const THRESHOLDS = {
  bp: { check: (v) => { const [sys] = v.split('/').map(Number); return sys >= 160 || sys <= 90; } },
  sugar: { check: (v) => Number(v) >= 200 || Number(v) <= 70 },
  spo2: { check: (v) => Number(v) < 92 },
  pulse: { check: (v) => Number(v) > 120 || Number(v) < 50 },
};

// POST /v1/parents/:id/vitals — record reading (caregiver/device)
healthRouter.post('/parents/:id/vitals', requireAuth, async (req, res) => {
  const { type, value, unit, visitId, source = 'caregiver' } = req.body;
  if (!type || value == null || !unit) {
    return res.status(400).json({ error: 'type, value, unit required' });
  }

  const rule = THRESHOLDS[type];
  const flagged = rule ? Boolean(rule.check(String(value))) : false;

  const reading = await prisma.vitalsReading.create({
    data: { parentId: req.params.id, visitId, type, value: String(value), unit, source, flagged },
  });

  await bus.emitEvent('vitals.recorded', { parentId: req.params.id, type, value, flagged });

  if (flagged) {
    await prisma.alert.create({
      data: {
        parentId: req.params.id,
        severity: 'warning',
        type: 'vitals_out_of_range',
      },
    });
  }

  res.status(201).json(reading);
});

// GET /v1/parents/:id/vitals?type=bp&range=30d — trend
healthRouter.get('/parents/:id/vitals', requireAuth, async (req, res) => {
  const { type, range } = req.query;
  const where = { parentId: req.params.id };
  if (type) where.type = type;
  if (range) {
    const days = parseInt(range.replace('d', ''), 10) || 30;
    where.recordedAt = { gte: new Date(Date.now() - days * 86400000) };
  }
  const readings = await prisma.vitalsReading.findMany({ where, orderBy: { recordedAt: 'asc' } });
  res.json(readings);
});
