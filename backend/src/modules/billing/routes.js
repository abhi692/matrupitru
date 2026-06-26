import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../lib/db.js';
import { requireAuth } from '../../lib/auth.js';
import { getIdempotencyKey, findByIdempotencyKey } from '../../lib/idempotency.js';
import {
  razorpayEnabled, stripeEnabled,
  createRazorpayOrder, verifyRazorpaySignature,
  createStripePaymentIntent, getStripePaymentIntent,
} from '../../lib/payments.js';

export const billingRouter = Router();

// POST /v1/payments/intent — create a payment. INR routes to Razorpay (the
// UPI/netbanking rail Indian buyers expect), everything else to Stripe — both
// in TEST MODE keys, real API calls, no real money moved. Without keys set
// for the relevant gateway, falls back to the original mock-success behaviour
// so local dev keeps working without any setup.
billingRouter.post('/payments/intent', requireAuth, async (req, res) => {
  const { familyId, amount, currency = 'INR', method = 'card', type = 'one_time', bookingId } = req.body;
  if (!familyId || !amount) return res.status(400).json({ error: 'familyId, amount required' });

  const idempotencyKey = getIdempotencyKey(req);
  const existing = await findByIdempotencyKey(prisma.payment, idempotencyKey);
  if (existing) return res.status(200).json(existing);

  const useRazorpay = currency.toUpperCase() === 'INR' && razorpayEnabled;
  const useStripe = currency.toUpperCase() !== 'INR' && stripeEnabled;

  let payment;
  if (useRazorpay) {
    const order = await createRazorpayOrder({ amount, currency, receipt: idempotencyKey || uuid() });
    payment = await prisma.payment.create({
      data: {
        familyId, amount, currency, method, type, status: 'pending', idempotencyKey,
        provider: 'razorpay', providerOrderId: order.id,
      },
    });
    return res.status(201).json({ ...payment, razorpayOrderId: order.id, razorpayKeyId: process.env.RAZORPAY_KEY_ID, bookingId });
  }

  if (useStripe) {
    const intent = await createStripePaymentIntent({ amount, currency, metadata: { familyId, bookingId: bookingId || '' } });
    payment = await prisma.payment.create({
      data: {
        familyId, amount, currency, method, type, status: 'pending', idempotencyKey,
        provider: 'stripe', providerPaymentId: intent.id,
      },
    });
    return res.status(201).json({ ...payment, stripeClientSecret: intent.client_secret, bookingId });
  }

  payment = await prisma.payment.create({
    data: { familyId, amount, currency, method, type, gatewayRef: `mock_${uuid()}`, status: 'succeeded', idempotencyKey },
  });

  if (bookingId) {
    await prisma.serviceBooking.update({ where: { id: bookingId }, data: { paymentId: payment.id, status: 'confirmed' } });
  }

  res.status(201).json(payment);
});

// POST /v1/payments/:id/verify — confirm a real-gateway payment after the
// client-side checkout (Razorpay Checkout.js / Stripe Elements) completes.
billingRouter.post('/payments/:id/verify', requireAuth, async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status === 'succeeded') return res.json(payment);

  const { bookingId } = req.body;
  let updated;

  if (payment.provider === 'razorpay') {
    const { razorpayPaymentId, razorpaySignature } = req.body;
    const ok = verifyRazorpaySignature({
      orderId: payment.providerOrderId, paymentId: razorpayPaymentId, signature: razorpaySignature,
    });
    if (!ok) return res.status(400).json({ error: 'Signature verification failed' });
    updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'succeeded', providerPaymentId: razorpayPaymentId, gatewayRef: razorpayPaymentId },
    });
  } else if (payment.provider === 'stripe') {
    const intent = await getStripePaymentIntent(payment.providerPaymentId);
    if (intent.status !== 'succeeded') return res.status(400).json({ error: `Stripe payment status: ${intent.status}` });
    updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'succeeded', gatewayRef: intent.id },
    });
  } else {
    return res.status(400).json({ error: 'No gateway provider on this payment' });
  }

  if (bookingId) {
    await prisma.serviceBooking.update({ where: { id: bookingId }, data: { paymentId: payment.id, status: 'confirmed' } });
  }
  res.json(updated);
});

// POST /v1/subscriptions — recurring mandate (mocked)
billingRouter.post('/subscriptions', requireAuth, async (req, res) => {
  const { familyId, amount, currency = 'USD' } = req.body;
  if (!familyId || !amount) return res.status(400).json({ error: 'familyId, amount required' });

  const idempotencyKey = getIdempotencyKey(req);
  const existing = await findByIdempotencyKey(prisma.subscription, idempotencyKey);
  if (existing) return res.status(200).json(existing);

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const subscription = await prisma.subscription.create({
    data: { familyId, amount, currency, periodStart, periodEnd, status: 'active', idempotencyKey },
  });
  res.status(201).json(subscription);
});

billingRouter.get('/families/:id/subscriptions', requireAuth, async (req, res) => {
  const subs = await prisma.subscription.findMany({ where: { familyId: req.params.id }, orderBy: { periodStart: 'desc' } });
  res.json(subs);
});
