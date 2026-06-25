import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Camera, ShieldCheck, ShieldAlert, ImageIcon, Loader2, Pill, Check, X, WifiOff, RefreshCw } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { enqueue, getQueue, removeFromQueue, isNetworkError } from '../../lib/offlineQueue';

const STATUS_VARIANT = { scheduled: 'neutral', in_progress: 'warning', completed: 'success' };

// Real field app per the design doc would be offline-first native (Phase 1 open
// question #5). This web version gets the offline-survival property a different
// way: actions that fail due to no connectivity are queued in IndexedDB and
// replayed automatically once the device is back online (§1.3).
export default function FieldApp() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [geo, setGeo] = useState({ lat: '', lng: '' });
  const [uploadingFor, setUploadingFor] = useState(null);
  const [medsByParent, setMedsByParent] = useState({});
  const [online, setOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(0);
  const fileInputs = useRef({});

  async function refreshQueueCount() {
    const q = await getQueue();
    setQueueCount(q.length);
  }

  async function syncQueue() {
    const queued = await getQueue();
    for (const item of queued) {
      try {
        if (item.kind === 'check-in') {
          await api.patch(`/visits/${item.visitId}/check-in`, item.payload);
        } else if (item.kind === 'check-out') {
          await api.patch(`/visits/${item.visitId}/check-out`, item.payload);
        }
        await removeFromQueue(item.id);
      } catch {
        break; // still offline or backend down — stop and retry next trigger
      }
    }
    await refreshQueueCount();
    refresh();
  }

  useEffect(() => {
    refreshQueueCount();
    const onOnline = () => { setOnline(true); syncQueue(); };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  function refresh() {
    api.get(`/visits?caregiverId=${user.id}`).then((vs) => {
      setVisits(vs);
      const parentIds = [...new Set(vs.filter((v) => v.status === 'in_progress').map((v) => v.parentId))];
      parentIds.forEach((pid) => {
        api.get(`/parents/${pid}/medications`).then((meds) =>
          setMedsByParent((m) => ({ ...m, [pid]: meds.filter((med) => med.status === 'pending') }))
        );
      });
    }).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (user) refresh();
  }, [user]);

  async function markMedication(logId, parentId, status) {
    setError('');
    try {
      await api.patch(`/medications/${logId}`, { status });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  function useDemoGeo(visit) {
    setGeo({ lat: String(visit.parent.geoLat), lng: String(visit.parent.geoLng) });
  }

  async function checkIn(visitId) {
    setError('');
    const payload = { lat: Number(geo.lat), lng: Number(geo.lng) };
    try {
      await api.patch(`/visits/${visitId}/check-in`, payload);
      refresh();
    } catch (err) {
      if (isNetworkError(err) || !navigator.onLine) {
        await enqueue({ kind: 'check-in', visitId, payload });
        await refreshQueueCount();
        setVisits((vs) => vs.map((v) => (v.id === visitId ? { ...v, status: 'in_progress', _queued: true } : v)));
      } else {
        setError(err.message);
      }
    }
  }

  async function uploadProof(visitId, file) {
    if (!file) return;
    setError('');
    setUploadingFor(visitId);
    try {
      await api.upload(`/visits/${visitId}/proof/upload`, file);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingFor(null);
    }
  }

  async function checkOut(visitId, checklist) {
    setError('');
    const payload = {
      lat: Number(geo.lat),
      lng: Number(geo.lng),
      checklist: checklist.map((c) => ({ ...c, done: true })),
    };
    try {
      await api.patch(`/visits/${visitId}/check-out`, payload);
      refresh();
    } catch (err) {
      if (isNetworkError(err) || !navigator.onLine) {
        await enqueue({ kind: 'check-out', visitId, payload });
        await refreshQueueCount();
        setVisits((vs) => vs.map((v) => (v.id === visitId ? { ...v, status: 'completed', _queued: true } : v)));
      } else {
        setError(err.message);
      }
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {!online && (
        <div className="flex items-center gap-2 text-sm font-medium text-warm-600 bg-warm-50 rounded-control px-4 py-3">
          <WifiOff className="h-4 w-4 shrink-0" /> Offline — actions will be saved and synced automatically when you're back online.
        </div>
      )}
      {queueCount > 0 && (
        <div className="flex items-center justify-between text-sm font-medium text-stone-600 bg-stone-100 rounded-control px-4 py-3">
          <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> {queueCount} action(s) waiting to sync</span>
          {online && <Button size="sm" variant="outline" onClick={syncQueue}>Sync now</Button>}
        </div>
      )}
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
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={STATUS_VARIANT[v.status]} className="capitalize">{v.status.replace('_', ' ')}</Badge>
                {v._queued && <Badge variant="warning">Queued — will sync</Badge>}
              </div>
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
                <input
                  ref={(el) => (fileInputs.current[v.id] = el)}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => uploadProof(v.id, e.target.files?.[0])}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={uploadingFor === v.id}
                  onClick={() => fileInputs.current[v.id]?.click()}
                >
                  {uploadingFor === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {uploadingFor === v.id ? 'Uploading...' : 'Take / upload proof photo'}
                </Button>
                {v.proofs?.length > 0 && (
                  <ul className="space-y-1">
                    {v.proofs.map((p) => (
                      <li key={p.id} className="text-xs text-stone-500 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" /> {p.type} uploaded {new Date(p.capturedAt).toLocaleTimeString()}
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="space-y-1">
                  {checklist.map((c, i) => (
                    <li key={i} className="text-sm text-stone-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" /> {c.task}
                    </li>
                  ))}
                </ul>

                {medsByParent[v.parentId]?.length > 0 && (
                  <div className="border border-stone-100 rounded-control p-3">
                    <p className="text-xs font-semibold text-stone-600 flex items-center gap-1.5 mb-2"><Pill className="h-3.5 w-3.5" /> Pending medications</p>
                    <ul className="space-y-2">
                      {medsByParent[v.parentId].map((med) => (
                        <li key={med.id} className="flex items-center justify-between text-sm">
                          <span className="text-stone-700">{med.medication}</span>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="subtle" onClick={() => markMedication(med.id, v.parentId, 'given')}>
                              <Check className="h-3.5 w-3.5" /> Given
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => markMedication(med.id, v.parentId, 'missed')}>
                              <X className="h-3.5 w-3.5" /> Missed
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
