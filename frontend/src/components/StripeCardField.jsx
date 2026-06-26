import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/Button';
import { getStripe } from '../lib/checkout';

// Mounts a real Stripe Elements card field and confirms the given PaymentIntent
// client secret — actual test-mode Stripe API calls, no real money moved.
export default function StripeCardField({ clientSecret, onSuccess, onError }) {
  const mountRef = useRef(null);
  const stripeRef = useRef(null);
  const elementRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStripe().then((stripe) => {
      if (cancelled || !stripe || !mountRef.current) return;
      stripeRef.current = stripe;
      const elements = stripe.elements();
      const card = elements.create('card');
      card.mount(mountRef.current);
      elementRef.current = card;
      setReady(true);
    });
    return () => {
      cancelled = true;
      elementRef.current?.unmount();
    };
  }, []);

  async function pay() {
    if (!stripeRef.current || !elementRef.current) return;
    setSubmitting(true);
    const { error, paymentIntent } = await stripeRef.current.confirmCardPayment(clientSecret, {
      payment_method: { card: elementRef.current },
    });
    setSubmitting(false);
    if (error) onError?.(error.message);
    else onSuccess?.(paymentIntent);
  }

  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
    return <p className="text-sm text-stone-500">Stripe publishable key not configured on the frontend.</p>;
  }

  return (
    <div className="space-y-3">
      <div ref={mountRef} className="border border-stone-200 rounded-control px-3 py-3" />
      <Button onClick={pay} disabled={!ready || submitting} className="w-full">
        {submitting ? 'Processing...' : 'Pay'}
      </Button>
    </div>
  );
}
