import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

// Dignified, low-friction parent UX: large text, minimal choices, one-tap SOS.
// Real Phase 1 also offers IVR/voice fallback for low tech-literacy elders (§1.1).
export default function ParentApp() {
  const { user } = useAuth();
  const [parent, setParent] = useState(null);
  const [visits, setVisits] = useState([]);
  const [sosStatus, setSosStatus] = useState('');
  const [error, setError] = useState('');

  function refresh() {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/dashboard`).then((d) => {
      const p = d.parents.find((p) => p.userId === user.id) || d.parents[0];
      setParent(p);
      setVisits([...d.upcomingVisits, ...d.recentVisits.filter((v) => !v.parentConfirmedAt)]);
    }).catch((e) => setError(e.message));
  }

  useEffect(refresh, [user]);

  async function confirmVisit(visitId) {
    setError('');
    try {
      await api.post(`/visits/${visitId}/confirm`);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function raiseSos() {
    if (!parent) return;
    setSosStatus('');
    try {
      await api.post(`/parents/${parent.id}/sos`, {});
      setSosStatus('Help is on the way. Your family and Care Manager have been notified.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="parent-app">
      <h1 className="big-greeting">Namaste, {parent?.user.name || ''}</h1>
      {error && <div className="error">{error}</div>}

      <button className="sos-button big" onClick={raiseSos}>🚨 I need help</button>
      {sosStatus && <p className="ok-text big-text">{sosStatus}</p>}

      <div className="card">
        <h2 className="big-text">Did your caregiver visit today?</h2>
        {visits.filter((v) => v.status === 'completed' && !v.parentConfirmedAt).length === 0 && (
          <p className="muted big-text">No visit waiting for your confirmation.</p>
        )}
        {visits.filter((v) => v.status === 'completed' && !v.parentConfirmedAt).map((v) => (
          <div key={v.id} className="confirm-row">
            <p className="big-text">{v.type} visit — {new Date(v.checkOutAt).toLocaleString()}</p>
            <button className="big" onClick={() => confirmVisit(v.id)}>Yes, they visited</button>
          </div>
        ))}
      </div>
    </div>
  );
}
