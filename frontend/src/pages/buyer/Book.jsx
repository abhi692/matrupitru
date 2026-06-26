import { useEffect, useState } from 'react';
import { Stethoscope, Activity, UserCheck, FlaskConical, Pill, ShoppingBag, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import StripeCardField from '../../components/StripeCardField';
import { openRazorpayCheckout } from '../../lib/checkout';
import { cn } from '../../lib/utils';

const ICONS = {
  'doctor-visit': Stethoscope,
  physio: Activity,
  'attendant-day': UserCheck,
  diagnostics: FlaskConical,
  medicines: Pill,
  errand: ShoppingBag,
};

export default function Book() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState(null);
  const [pendingCheckout, setPendingCheckout] = useState(null);

  useEffect(() => {
    api.get('/catalog/services').then(setCatalog);
    if (user?.familyId) {
      api.get(`/families/${user.familyId}/dashboard`).then((d) => setParentId(d.parents[0]?.id));
    }
  }, [user]);

  async function book() {
    setStatus(null);
    setPendingCheckout(null);
    const service = catalog.find((s) => s.id === selected);
    if (!service) return;
    try {
      const booking = await api.post('/bookings', {
        familyId: user.familyId,
        parentId,
        serviceCatalogId: selected,
      }, crypto.randomUUID());
      const payment = await api.post('/payments/intent', {
        familyId: user.familyId,
        amount: service.price,
        currency: service.currency,
        type: 'one_time',
        bookingId: booking.id,
      }, crypto.randomUUID());

      if (payment.status === 'succeeded') {
        setStatus({ ok: true, message: `Booked ${service.name} for ${service.currency} ${service.price}. Payment succeeded.` });
        return;
      }

      if (payment.provider === 'razorpay') {
        try {
          const { razorpayPaymentId, razorpaySignature } = await openRazorpayCheckout({
            keyId: payment.razorpayKeyId,
            orderId: payment.razorpayOrderId,
            amount: service.price,
            currency: service.currency,
            description: service.name,
          });
          await api.post(`/payments/${payment.id}/verify`, { razorpayPaymentId, razorpaySignature, bookingId: booking.id });
          setStatus({ ok: true, message: `Booked ${service.name} — payment confirmed via Razorpay.` });
        } catch (err) {
          setStatus({ ok: false, message: err.message });
        }
        return;
      }

      if (payment.provider === 'stripe') {
        setPendingCheckout({ payment, booking, service });
        return;
      }

      setStatus({ ok: true, message: `Booked ${service.name}. Payment ${payment.status}.` });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    }
  }

  async function onStripeSuccess() {
    try {
      await api.post(`/payments/${pendingCheckout.payment.id}/verify`, { bookingId: pendingCheckout.booking.id });
      setStatus({ ok: true, message: `Booked ${pendingCheckout.service.name} — payment confirmed via Stripe.` });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    } finally {
      setPendingCheckout(null);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-stone-900 mb-1">Book a service</h2>
      <p className="text-stone-500 text-sm mb-6">On-demand doctor visits, physio, diagnostics, and more.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {catalog.map((s) => {
          const Icon = ICONS[s.id] || ShoppingBag;
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-card border-2 p-4 text-left transition-all',
                active ? 'border-brand-500 bg-brand-50/60 shadow-soft' : 'border-stone-100 bg-white hover:border-stone-200'
              )}
            >
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', active ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500')}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="font-medium text-sm text-stone-800">{s.name}</span>
              <span className="text-xs text-stone-400">{s.currency} {s.price}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardTitle>Confirm booking</CardTitle>
        <CardDescription className="mb-4">
          INR pays via Razorpay (UPI/netbanking), other currencies via Stripe — test-mode keys, real gateway calls.
        </CardDescription>
        {!pendingCheckout && (
          <Button onClick={book} disabled={!selected} size="lg" className="w-full">
            Book &amp; pay
          </Button>
        )}

        {pendingCheckout && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600">
              {pendingCheckout.service.currency} {pendingCheckout.service.price} for {pendingCheckout.service.name}
            </p>
            <StripeCardField
              clientSecret={pendingCheckout.payment.stripeClientSecret}
              onSuccess={onStripeSuccess}
              onError={(msg) => setStatus({ ok: false, message: msg })}
            />
          </div>
        )}

        {status && (
          <div
            className={cn(
              'flex items-center gap-2 text-sm rounded-control px-3 py-2.5 mt-4',
              status.ok ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-600'
            )}
          >
            {status.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {status.message}
          </div>
        )}
      </Card>
    </div>
  );
}
