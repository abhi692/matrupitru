import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export default function Billing() {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [amount, setAmount] = useState(99);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user?.familyId) {
      api.get(`/families/${user.familyId}/subscriptions`).then(setSubs);
    }
  }, [user]);

  async function subscribe() {
    setStatus('');
    try {
      const sub = await api.post('/subscriptions', { familyId: user.familyId, amount: Number(amount), currency: 'USD' }, crypto.randomUUID());
      setSubs((s) => [sub, ...s]);
      setStatus('Subscription active (mock gateway).');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card>
        <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-brand-500" /> Billing &amp; subscription</CardTitle>
        <CardDescription className="mb-5">
          Recurring subscriptions are mocked for Phase 1 (no gateway has a stable test-mode
          recurring-mandate flow worth wiring up yet); one-time service payments on the
          <span className="font-medium"> Book a service</span> page use real Razorpay/Stripe test-mode checkout.
        </CardDescription>
        <Label>Monthly amount (USD)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Button onClick={subscribe} size="lg" className="w-full mt-3">
          Subscribe
        </Button>
        {status && (
          <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 rounded-control px-3 py-2.5 mt-4">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {status}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Subscription history</CardTitle>
        {subs.length === 0 ? (
          <p className="text-stone-400 text-sm mt-2">No subscriptions yet.</p>
        ) : (
          <ul className="space-y-2 mt-3">
            {subs.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2.5">
                <span className="font-medium text-stone-700">{s.currency} {s.amount}/mo</span>
                <div className="flex items-center gap-2">
                  <Badge variant="success" className="capitalize">{s.status}</Badge>
                  <span className="text-stone-400 text-xs">
                    {new Date(s.periodStart).toLocaleDateString()} – {new Date(s.periodEnd).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
