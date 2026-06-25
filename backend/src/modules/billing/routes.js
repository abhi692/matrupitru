import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';

export const billingRouter = Router();

// POST /v1/payments/intent — create payment (intl/local). Mocked: always succeeds,
// stands in for Stripe (intl cards) / Razorpay (UPI/netbanking) per §1.3, §8.
billingRouter.post('/payments/intent', requireAuth, async (req, res) => {
  const { familyId, amount, currency = 'INR', method = 'card', type = 'one_time', bookingId } = req.body;
  if (!familyId || !amount) return res.status(400).json({ error: 'familyId, amount required' });

  const payment = await prisma.payment.create({
    data: { familyId, amount, currency, method, type, gatewayRef: `mock_${uuid()}`, status: 'succeeded' },
  });

  if (bookingId) {
    await prisma.serviceBooking.update({ where: { id: bookingId }, data: { paymentId: payment.id, status: 'confirmed' } });
  }

  res.status(201).json(payment);
});

// POST /v1/subscriptions — recurring mandate (mocked)
billingRouter.post('/subscriptions', requireAuth, async (req, res) => {
  const { familyId, amount, currency = 'USD' } = req.body;
  if (!familyId || !amount) return res.status(400).json({ error: 'familyId, amount required' });

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: { familyId, amount, currency, periodStart, periodEnd, status: 'active' },
  });
  res.status(201).json(subscription);
});

billingRouter.get('/families/:id/subscriptions', requireAuth, async (req, res) => {
  const subs = await prisma.subscription.findMany({ where: { familyId: req.params.id }, orderBy: { periodStart: 'desc' } });
  res.json(subs);
});
