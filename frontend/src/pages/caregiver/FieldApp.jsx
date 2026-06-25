import { useEffect, useState } from 'react';
import { MapPin, Navigation, Camera, ShieldCheck, ShieldAlert } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const STATUS_VARIANT = { scheduled: 'neutral', in_progress: 'warning', completed: 'success' };

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
    <div className="max-w-xl mx-auto space-y-4">
      {error && <p className="text-rose-600 bg-rose-50 rounded-control px-4 py-3">{error}</p>}

      <Card>
        <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-brand-500" /> Geo (simulated device location)</CardTitle>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Input placeholder="lat" value={geo.lat} onChange={(e) => setGeo({ ...geo, lat: e.target.value })} />
          <Input placeholder="lng" value={geo.lng} onChange={(e) => setGeo({ ...geo, lng: e.target.value })} />
        </div>
        <p className="text-stone-400 text-xs mt-2">Tap "Use parent's address" on a visit below to simulate arriving on-site.</p>
      </Card>

      {visits.map((v) => {
        const checklist = JSON.parse(v.taskChecklistJson || '[]');
        return (
          <Card key={v.id}>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="capitalize">{v.type} — {v.parent.user.name}</CardTitle>
                <p className="text-stone-400 text-sm flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5" /> {v.parent.address}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[v.status]} className="capitalize shrink-0">{v.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-stone-500 mt-2">Scheduled: {new Date(v.scheduledAt).toLocaleString()}</p>

            <Button variant="outline" size="sm" className="mt-3" onClick={() => useDemoGeo(v)}>
              <MapPin className="h-3.5 w-3.5" /> Use parent's address (simulate on-site)
            </Button>

            {v.status === 'scheduled' && (
              <Button className="w-full mt-3" onClick={() => checkIn(v.id)}>Check in</Button>
            )}

            {v.status === 'in_progress' && (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  <Input placeholder="Proof photo URL" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
                  <Button variant="outline" onClick={() => uploadProof(v.id)}><Camera className="h-4 w-4" /></Button>
                </div>
                <ul className="space-y-1">
                  {checklist.map((c, i) => (
                    <li key={i} className="text-sm text-stone-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> {c.task}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => checkOut(v.id, checklist)}>Complete checklist &amp; check out</Button>
              </div>
            )}

            {v.status === 'completed' && (
              <div className={`flex items-center gap-2 text-sm font-medium rounded-control px-3 py-2 mt-3 ${v.geoVerified ? 'bg-brand-50 text-brand-700' : 'bg-warm-50 text-warm-600'}`}>
                {v.geoVerified ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                Visit completed {v.geoVerified ? '(geo-verified)' : '(not geo-verified — flagged)'}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
