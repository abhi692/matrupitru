import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

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
      const sub = await api.post('/subscriptions', { familyId: user.familyId, amount: Number(amount), currency: 'USD' });
      setSubs((s) => [sub, ...s]);
      setStatus('Subscription active (mock gateway).');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div className="card">
      <h2>Billing & subscription</h2>
      <p className="muted">International cards (Stripe) / UPI & netbanking (Razorpay) integration is mocked for Phase 1 local build.</p>
      <label>Monthly amount (USD)</label>
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <button onClick={subscribe}>Subscribe</button>
      {status && <p>{status}</p>}

      <h3>Subscription history</h3>
      <ul>
        {subs.map((s) => (
          <li key={s.id}>
            {s.currency} {s.amount}/mo — {s.status} — {new Date(s.periodStart).toLocaleDateString()} to {new Date(s.periodEnd).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
