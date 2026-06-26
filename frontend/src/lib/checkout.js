import { loadStripe } from '@stripe/stripe-js';

// Loads the Razorpay Checkout script once and opens the popup. Resolves with
// { razorpayPaymentId, razorpaySignature } on success, rejects on dismiss/failure.
export function openRazorpayCheckout({ keyId, orderId, amount, currency, name, description }) {
  return new Promise((resolve, reject) => {
    function open() {
      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount: Math.round(amount * 100),
        currency,
        name: name || 'MatruPitru',
        description,
        handler: (response) =>
          resolve({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      });
      rzp.open();
    }

    if (window.Razorpay) return open();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = open;
    script.onerror = () => reject(new Error('Could not load Razorpay checkout'));
    document.body.appendChild(script);
  });
}

let stripePromise;
export function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!key) return Promise.resolve(null);
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
