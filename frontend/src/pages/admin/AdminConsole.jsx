import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldX, ShieldQuestion, Activity, MapPinned, ScrollText } from 'lucide-react';
import { api } from '../../api/client';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

const STATUS_BADGE = { verified: 'success', pending: 'warning', rejected: 'danger' };

export default function AdminConsole() {
  const [caregivers, setCaregivers] = useState([]);
  const [sla, setSla] = useState(null);
  const [audit, setAudit] = useState([]);
  const [cityDraft, setCityDraft] = useState({});
  const [error, setError] = useState('');

  function refresh() {
    api.get('/admin/caregivers').then(setCaregivers).catch((e) => setError(e.message));
    api.get('/admin/sla').then(setSla).catch((e) => setError(e.message));
    api.get('/admin/audit').then(setAudit).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function setVerification(id, status) {
    await api.patch(`/admin/caregivers/${id}/verification`, { status });
    refresh();
  }

  async function saveCoverage(id) {
    const cities = (cityDraft[id] ?? '').split(',').map((c) => c.trim()).filter(Boolean);
    await api.patch(`/admin/caregivers/${id}/coverage`, { cities });
    refresh();
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-rose-600 bg-rose-50 rounded-control px-4 py-3">{error}</p>}

      <Card>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-brand-500" /> SLA &amp; success metrics</CardTitle>
        <CardDescription className="mb-4">Computed from live data — the operational health metrics that map to the trust value prop (§7, §11).</CardDescription>
        {sla && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Metric label="Geo-verified visit rate" value={sla.geoVerifiedRate != null ? `${sla.geoVerifiedRate}%` : '—'} />
            <Metric label="Missed-visit rate" value={sla.missedVisitRate != null ? `${sla.missedVisitRate}%` : '—'} warn={sla.missedVisitRate > 10} />
            <Metric label="Avg SOS ack time" value={sla.avgSosAckSeconds != null ? `${sla.avgSosAckSeconds}s` : '—'} warn={sla.avgSosAckSeconds > 60} />
            <Metric label="Total visits" value={sla.totalVisits} />
            <Metric label="Families" value={sla.totalFamilies} />
            <Metric label="Active parents (30d)" value={sla.activeParents30d} />
          </div>
        )}
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-brand-500" /> Caregiver verification &amp; coverage</CardTitle>
        <div className="space-y-3 mt-3">
          {caregivers.map((c) => (
            <div key={c.id} className="border border-stone-100 rounded-control p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold text-stone-800">{c.user.name}</span>
                  <span className="text-stone-400 text-sm ml-2">{c.user.phone}</span>
                </div>
                <Badge variant={STATUS_BADGE[c.verificationStatus]} className="capitalize">{c.verificationStatus}</Badge>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Background check: {c.backgroundCheckRef || 'not on file'} · Rating: {c.rating || 'n/a'}
              </p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant={c.verificationStatus === 'verified' ? 'subtle' : 'outline'} onClick={() => setVerification(c.id, 'verified')}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify
                </Button>
                <Button size="sm" variant="outline" onClick={() => setVerification(c.id, 'pending')}>
                  <ShieldQuestion className="h-3.5 w-3.5" /> Mark pending
                </Button>
                <Button size="sm" variant="outline" onClick={() => setVerification(c.id, 'rejected')}>
                  <ShieldX className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
              <div className="flex gap-2 mt-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-stone-500 flex items-center gap-1 mb-1"><MapPinned className="h-3 w-3" /> Service cities (comma separated)</label>
                  <Input
                    defaultValue={JSON.parse(c.serviceCitiesJson || '[]').join(', ')}
                    onChange={(e) => setCityDraft({ ...cityDraft, [c.id]: e.target.value })}
                  />
                </div>
                <Button size="sm" onClick={() => saveCoverage(c.id)}>Save</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-brand-500" /> Audit log</CardTitle>
        <CardDescription className="mb-3">Every domain event, for accountability (DPDP-style audit trail).</CardDescription>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {audit.map((e) => (
            <div key={e.id} className="text-xs text-stone-500 border-b border-stone-50 py-1.5 flex justify-between gap-2">
              <span className="font-medium text-stone-700">{e.type}</span>
              <span>{new Date(e.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Metric({ label, value, warn }) {
  return (
    <div className={`rounded-control border p-3 ${warn ? 'border-warm-200 bg-warm-50/40' : 'border-stone-100'}`}>
      <div className={`text-2xl font-bold ${warn ? 'text-warm-600' : 'text-brand-700'}`}>{value}</div>
      <div className="text-xs text-stone-500 mt-0.5">{label}</div>
    </div>
  );
}
