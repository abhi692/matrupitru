import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

export default function Book() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/catalog/services').then(setCatalog);
    if (user?.familyId) {
      api.get(`/families/${user.familyId}/dashboard`).then((d) => setParentId(d.parents[0]?.id));
    }
  }, [user]);

  async function book() {
    setStatus('');
    const service = catalog.find((s) => s.id === selected);
    if (!service) return;
    try {
      const booking = await api.post('/bookings', {
        familyId: user.familyId,
        parentId,
        serviceCatalogId: selected,
      });
      const payment = await api.post('/payments/intent', {
        familyId: user.familyId,
        amount: service.price,
        currency: service.currency,
        type: 'one_time',
        bookingId: booking.id,
      });
      setStatus(`Booked ${service.name} for ${service.currency} ${service.price}. Payment ${payment.status}.`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div className="card">
      <h2>Book a service</h2>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">Choose a service</option>
        {catalog.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} — {s.currency} {s.price}
          </option>
        ))}
      </select>
      <button onClick={book} disabled={!selected}>Book & pay (mock)</button>
      {status && <p>{status}</p>}
    </div>
  );
}
