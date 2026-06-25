import { useEffect, useState } from 'react';
import { Siren, HeartHandshake } from 'lucide-react';
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

  const pendingConfirm = visits.filter((v) => v.status === 'completed' && !v.parentConfirmedAt);

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <HeartHandshake className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-bold text-brand-700">Namaste, {parent?.user.name || ''}</h1>
      </div>

      {error && <p className="text-base text-rose-600 bg-rose-50 rounded-card px-4 py-3">{error}</p>}

      <button
        onClick={raiseSos}
        className="w-full flex items-center justify-center gap-3 rounded-card bg-rose-600 hover:bg-rose-700 text-white text-xl font-bold py-6 shadow-soft-lg transition-colors"
      >
        <Siren className="h-7 w-7" /> I need help
      </button>
      {sosStatus && <p className="text-lg text-brand-700 bg-brand-50 rounded-card px-4 py-3">{sosStatus}</p>}

      <div className="bg-white rounded-card border border-stone-100 shadow-soft p-6">
        <h2 className="text-xl font-semibold text-stone-800 mb-4">Did your caregiver visit today?</h2>
        {pendingConfirm.length === 0 ? (
          <p className="text-lg text-stone-400">No visit waiting for your confirmation.</p>
        ) : (
          <div className="space-y-4">
            {pendingConfirm.map((v) => (
              <div key={v.id} className="border border-stone-100 rounded-control p-4">
                <p className="text-lg text-stone-700 capitalize mb-3">
                  {v.type} visit — {new Date(v.checkOutAt).toLocaleString()}
                </p>
                <button
                  onClick={() => confirmVisit(v.id)}
                  className="w-full rounded-control bg-brand-500 hover:bg-brand-600 text-white text-lg font-semibold py-4 transition-colors"
                >
                  Yes, they visited
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
