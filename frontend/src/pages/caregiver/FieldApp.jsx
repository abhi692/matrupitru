import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

// Real field app per the design doc would be offline-first native (Phase 1 open
// question #5). This is the web simulation of the same check-in/checklist/proof flow.
export default function FieldApp() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [geo, setGeo] = useState({ lat: '', lng: '' });
  const [proofUrl, setProofUrl] = useState('');

  function refresh() {
    api.get(`/visits?caregiverId=${user.id}`).then(setVisits).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  function useDemoGeo(visit) {
    // Simulates the caregiver's phone being at the parent's home address.
    setGeo({ lat: String(visit.parent.geoLat), lng: String(visit.parent.geoLng) });
  }

  async function checkIn(visitId) {
    setError('');
    try {
      await api.patch(`/visits/${visitId}/check-in`, { lat: Number(geo.lat), lng: Number(geo.lng) });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function uploadProof(visitId) {
    if (!proofUrl) return;
    try {
      await api.post(`/visits/${visitId}/proof`, { type: 'photo', storageUrl: proofUrl });
      setProofUrl('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function checkOut(visitId, checklist) {
    setError('');
    try {
      await api.patch(`/visits/${visitId}/check-out`, {
        lat: Number(geo.lat),
        lng: Number(geo.lng),
        checklist: checklist.map((c) => ({ ...c, done: true })),
      });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="caregiver-app">
      {error && <div className="error">{error}</div>}
      <div className="card">
        <h2>Geo (simulated device location)</h2>
        <div className="row">
          <input placeholder="lat" value={geo.lat} onChange={(e) => setGeo({ ...geo, lat: e.target.value })} />
          <input placeholder="lng" value={geo.lng} onChange={(e) => setGeo({ ...geo, lng: e.target.value })} />
        </div>
        <p className="muted">Click "Use parent's address" on a visit below to simulate arriving on-site.</p>
      </div>

      {visits.map((v) => {
        const checklist = JSON.parse(v.taskChecklistJson || '[]');
        return (
          <div key={v.id} className="card visit-card">
            <h3>{v.type} — {v.parent.user.name}</h3>
            <p className="muted">{v.parent.address}</p>
            <p>Scheduled: {new Date(v.scheduledAt).toLocaleString()} — Status: <strong>{v.status}</strong></p>
            <button onClick={() => useDemoGeo(v)}>Use parent's address (simulate on-site)</button>

            {v.status === 'scheduled' && (
              <button onClick={() => checkIn(v.id)}>Check in</button>
            )}

            {v.status === 'in_progress' && (
              <>
                <div className="row">
                  <input placeholder="Proof photo URL" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
                  <button onClick={() => uploadProof(v.id)}>Upload proof</button>
                </div>
                <ul>
                  {checklist.map((c, i) => <li key={i}>{c.task}</li>)}
                </ul>
                <button onClick={() => checkOut(v.id, checklist)}>Complete checklist & check out</button>
              </>
            )}

            {v.status === 'completed' && <p className="ok-text">Visit completed {v.geoVerified ? '(geo-verified)' : '(not geo-verified — flagged)'}</p>}
          </div>
        );
      })}
    </div>
  );
}
