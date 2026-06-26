import crypto from 'crypto';
import Razorpay from 'razorpay';
import Stripe from 'stripe';

// Real payment gateways, each gated behind its own env var — same graceful-
// degradation pattern as the AI digest. Without keys set, payments/intent
// falls back to the original mock-success behaviour so local dev still works.
export const razorpayEnabled = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const stripeEnabled = Boolean(process.env.STRIPE_SECRET_KEY);

const razorpay = razorpayEnabled
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

const stripe = stripeEnabled ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Razorpay wants amounts in the smallest unit (paise for INR).
export async function createRazorpayOrder({ amount, currency, receipt }) {
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt,
  });
  return order;
}

export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

// Stripe wants amounts in the smallest unit too (cents for USD).
export async function createStripePaymentIntent({ amount, currency, metadata }) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata,
  });
}

export async function getStripePaymentIntent(id) {
  return stripe.paymentIntents.retrieve(id);
}
