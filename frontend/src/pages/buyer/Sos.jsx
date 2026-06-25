import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

// §6.2: SOS must reach a human in <60s. This view mirrors the buyer-side
// visibility into that path — raising it, and watching it get acknowledged.
export default function Sos() {
  const { user } = useAuth();
  const [parentId, setParentId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [sosResult, setSosResult] = useState(null);

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/dashboard`).then((d) => {
      setParentId(d.parents[0]?.id);
    });
    refreshAlerts();
  }, [user]);

  function refreshAlerts() {
    if (!user?.familyId) return;
    api.get(`/alerts?family=${user.familyId}`).then(setAlerts).catch((e) => setError(e.message));
  }

  async function raiseSos() {
    if (!parentId) return;
    setError('');
    try {
      const result = await api.post(`/parents/${parentId}/sos`, {});
      setSosResult(result);
      refreshAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card sos-card">
      <h2>Emergency (SOS)</h2>
      <p className="muted">
        Raising this simulates the parent tapping SOS — it notifies the Care Manager and you,
        across channels (push + SMS + WhatsApp), and degrades to a phone call if needed.
      </p>
      <button className="sos-button" onClick={raiseSos}>🚨 Raise SOS now</button>
      {error && <div className="error">{error}</div>}
      {sosResult && (
        <div className="ok-text">
          Alert raised. Care Manager notified: {sosResult.notified.careManager ? 'yes' : 'no'}.
          Buyers notified: {sosResult.notified.buyers}.
        </div>
      )}

      <h3>Alert history</h3>
      <ul>
        {alerts.map((a) => (
          <li key={a.id} className={`alert-${a.severity}`}>
            <strong>{a.type}</strong> — {a.severity} — {new Date(a.triggeredAt).toLocaleString()}
            {a.acknowledgedAt ? ` — acknowledged ${new Date(a.acknowledgedAt).toLocaleString()}` : ' — pending acknowledgement'}
          </li>
        ))}
      </ul>
    </div>
  );
}
