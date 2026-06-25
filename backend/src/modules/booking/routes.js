import { Router } from 'express';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { SERVICE_CATALOG } from './catalog.js';
import { getIdempotencyKey, findByIdempotencyKey } from '../../lib/idempotency.js';

export const bookingRouter = Router();

// GET /v1/catalog/services
bookingRouter.get('/catalog/services', requireAuth, (req, res) => {
  res.json(SERVICE_CATALOG);
});

// POST /v1/bookings — book a service
bookingRouter.post('/bookings', requireAuth, async (req, res) => {
  const { familyId, parentId, serviceCatalogId, scheduledAt, vendorId } = req.body;
  const service = SERVICE_CATALOG.find((s) => s.id === serviceCatalogId);
  if (!service) return res.status(400).json({ error: 'Unknown service' });

  const idempotencyKey = getIdempotencyKey(req);
  const existing = await findByIdempotencyKey(prisma.serviceBooking, idempotencyKey);
  if (existing) return res.status(200).json(existing);

  const booking = await prisma.serviceBooking.create({
    data: {
      familyId,
      parentId,
      serviceCatalogId,
      vendorId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      price: service.price,
      currency: service.currency,
      status: 'requested',
      idempotencyKey,
    },
  });
  res.status(201).json(booking);
});
