import { useEffect, useState } from 'react';
import { AlertTriangle, Users, CalendarPlus, MapPin, MessageCircle, Pill } from 'lucide-react';
import { api } from '../../api/client';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Label } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import ChatPanel from '../../components/ChatPanel';

const SEVERITY_VARIANT = { emergency: 'danger', critical: 'danger', warning: 'warning', info: 'neutral' };

export default function Console() {
  const [families, setFamilies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ parentId: '', caregiverId: '', type: 'attendant', scheduledAt: '', checklist: '' });
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [activeFamilyId, setActiveFamilyId] = useState('');
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [medForm, setMedForm] = useState({ parentId: '', medication: '', scheduledAt: '' });
  const [medStatus, setMedStatus] = useState('');

  function refresh() {
    api.get('/families').then(setFamilies).catch((e) => setError(e.message));
    api.get('/alerts').then(setAlerts).catch((e) => setError(e.message));
    api.get('/caregivers').then(setCaregivers).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function scheduleVisit(e) {
    e.preventDefault();
    setScheduleStatus('');
    try {
      await api.post('/visits', {
        parentId: form.parentId,
        caregiverId: form.caregiverId || undefined,
        type: form.type,
        scheduledAt: form.scheduledAt,
        taskChecklist: form.checklist ? form.checklist.split(',').map((c) => c.trim()) : [],
      }, crypto.randomUUID());
      setScheduleStatus('Visit scheduled.');
    } catch (err) {
      setScheduleStatus(`Error: ${err.message}`);
    }
  }

  async function acknowledge(id) {
    await api.patch(`/alerts/${id}/acknowledge`, { resolution: 'Acknowledged by Care Manager' });
    refresh();
  }

  async function scheduleMedication(e) {
    e.preventDefault();
    setMedStatus('');
    try {
      await api.post(`/parents/${medForm.parentId}/medications`, {
        medication: medForm.medication,
        scheduledAt: medForm.scheduledAt,
      });
      setMedStatus('Medication reminder scheduled.');
    } catch (err) {
      setMedStatus(`Error: ${err.message}`);
    }
  }

  async function openThread(familyId) {
    setActiveFamilyId(familyId);
    const thread = await api.get(`/families/${familyId}/thread`);
    setActiveThreadId(thread.id);
  }

  const openAlerts = alerts.filter((a) => !a.acknowledgedAt);
  const allParents = families.flatMap((f) => f.parents.map((p) => ({ ...p, familyName: f.users.find((u) => u.role === 'buyer')?.name })));

  return (
    <div className="space-y-6">
      {error && <p className="text-rose-600 bg-rose-50 rounded-control px-4 py-3">{error}</p>}

      <Card className={openAlerts.length > 0 ? 'border-warm-200' : undefined}>
        <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warm-600" /> Alert queue</CardTitle>
        {openAlerts.length === 0 ? (
          <p className="text-stone-400 text-sm mt-2">No open alerts.</p>
        ) : (
          <ul className="space-y-2 mt-3">
            {openAlerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant={SEVERITY_VARIANT[a.severity] || 'neutral'} className="capitalize">{a.severity}</Badge>
                  <span className="font-medium text-stone-700 capitalize">{a.type.replace(/_/g, ' ')}</span>
                  <span className="text-stone-400 text-xs">{new Date(a.triggeredAt).toLocaleString()}</span>
                </div>
                <Button size="sm" variant="subtle" onClick={() => acknowledge(a.id)}>Acknowledge</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-brand-500" /> Family roster</CardTitle>
        <div className="space-y-4 mt-3">
          {families.map((f) => (
            <div key={f.id} className="border border-stone-100 rounded-control p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">{f.users.find((u) => u.role === 'buyer')?.name || 'Family'}</span>
                <Badge variant="brand" className="capitalize">{f.carePlan?.tier?.replace(/_/g, ' ') || 'no plan'}</Badge>
              </div>
              <ul className="mt-2 space-y-1">
                {f.parents.map((p) => (
                  <li key={p.id} className="flex items-center gap-1.5 text-sm text-stone-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {p.user.name} — {p.address}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-brand-500" /> Messages</CardTitle>
        <div className="mt-3 mb-3">
          <Select value={activeFamilyId} onChange={(e) => openThread(e.target.value)}>
            <option value="">Select a family to message</option>
            {families.map((f) => (
              <option key={f.id} value={f.id}>{f.users.find((u) => u.role === 'buyer')?.name || 'Family'}</option>
            ))}
          </Select>
        </div>
        {activeThreadId && <ChatPanel threadId={activeThreadId} />}
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-brand-500" /> Schedule a medication reminder</CardTitle>
        <form onSubmit={scheduleMedication} className="space-y-4 mt-3">
          <div>
            <Label>Parent</Label>
            <Select value={medForm.parentId} onChange={(e) => setMedForm({ ...medForm, parentId: e.target.value })}>
              <option value="">Select parent</option>
              {allParents.map((p) => (
                <option key={p.id} value={p.id}>{p.user.name} ({p.familyName})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Medication</Label>
            <Input value={medForm.medication} onChange={(e) => setMedForm({ ...medForm, medication: e.target.value })} placeholder="Amlodipine 5mg" />
          </div>
          <div>
            <Label>Scheduled at</Label>
            <Input type="datetime-local" value={medForm.scheduledAt} onChange={(e) => setMedForm({ ...medForm, scheduledAt: e.target.value })} />
          </div>
          <Button type="submit" size="lg" className="w-full">Schedule reminder</Button>
          {medStatus && <p className="text-sm text-stone-500 text-center">{medStatus}</p>}
        </form>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2"><CalendarPlus className="h-5 w-5 text-brand-500" /> Schedule a visit</CardTitle>
        <form onSubmit={scheduleVisit} className="space-y-4 mt-3">
          <div>
            <Label>Parent</Label>
            <Select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
              <option value="">Select parent</option>
              {allParents.map((p) => (
                <option key={p.id} value={p.id}>{p.user.name} ({p.familyName})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Caregiver</Label>
            <Select value={form.caregiverId} onChange={(e) => setForm({ ...form, caregiverId: e.target.value })}>
              <option value="">Unassigned</option>
              {caregivers.map((c) => (
                <option key={c.userId} value={c.userId}>{c.user.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Visit type</Label>
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="attendant">Attendant</option>
              <option value="nurse">Nurse</option>
              <option value="doctor">Doctor</option>
              <option value="physio">Physio</option>
              <option value="errand">Errand</option>
            </Select>
          </div>
          <div>
            <Label>Scheduled at</Label>
            <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          </div>
          <div>
            <Label>Checklist (comma separated)</Label>
            <Input value={form.checklist} onChange={(e) => setForm({ ...form, checklist: e.target.value })} placeholder="Check BP, Give medication" />
          </div>
          <Button type="submit" size="lg" className="w-full">Schedule</Button>
          {scheduleStatus && <p className="text-sm text-stone-500 text-center">{scheduleStatus}</p>}
        </form>
      </Card>
    </div>
  );
}
