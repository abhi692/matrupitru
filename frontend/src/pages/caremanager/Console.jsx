import { useEffect, useState } from 'react';
import { api } from '../../api/client';

export default function Console() {
  const [families, setFamilies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ parentId: '', caregiverId: '', type: 'attendant', scheduledAt: '', checklist: '' });
  const [scheduleStatus, setScheduleStatus] = useState('');

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
      });
      setScheduleStatus('Visit scheduled.');
    } catch (err) {
      setScheduleStatus(`Error: ${err.message}`);
    }
  }

  async function acknowledge(id) {
    await api.patch(`/alerts/${id}/acknowledge`, { resolution: 'Acknowledged by Care Manager' });
    refresh();
  }

  const allParents = families.flatMap((f) => f.parents.map((p) => ({ ...p, familyName: f.users.find((u) => u.role === 'buyer')?.name })));

  return (
    <div className="cm-console">
      {error && <div className="error">{error}</div>}

      <div className="card">
        <h2>Alert queue</h2>
        {alerts.filter((a) => !a.acknowledgedAt).length === 0 && <p className="muted">No open alerts.</p>}
        <ul>
          {alerts.filter((a) => !a.acknowledgedAt).map((a) => (
            <li key={a.id} className={`alert-${a.severity}`}>
              <strong>{a.type}</strong> — {a.severity} — {new Date(a.triggeredAt).toLocaleString()}
              {' '}<button onClick={() => acknowledge(a.id)}>Acknowledge</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Family roster</h2>
        {families.map((f) => (
          <div key={f.id} className="roster-row">
            <strong>{f.users.find((u) => u.role === 'buyer')?.name || 'Family'}</strong> — {f.carePlan?.tier || 'no plan'}
            <ul>
              {f.parents.map((p) => (
                <li key={p.id}>{p.user.name} — {p.address} (parentId: {p.id})</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Schedule a visit</h2>
        <form onSubmit={scheduleVisit} className="form">
          <label>Parent</label>
          <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
            <option value="">Select parent</option>
            {allParents.map((p) => (
              <option key={p.id} value={p.id}>{p.user.name} ({p.familyName})</option>
            ))}
          </select>
          <label>Caregiver</label>
          <select value={form.caregiverId} onChange={(e) => setForm({ ...form, caregiverId: e.target.value })}>
            <option value="">Unassigned</option>
            {caregivers.map((c) => (
              <option key={c.userId} value={c.userId}>{c.user.name}</option>
            ))}
          </select>
          <label>Visit type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="attendant">Attendant</option>
            <option value="nurse">Nurse</option>
            <option value="doctor">Doctor</option>
            <option value="physio">Physio</option>
            <option value="errand">Errand</option>
          </select>
          <label>Scheduled at</label>
          <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
          <label>Checklist (comma separated)</label>
          <input value={form.checklist} onChange={(e) => setForm({ ...form, checklist: e.target.value })} placeholder="Check BP, Give medication" />
          <button type="submit">Schedule</button>
          {scheduleStatus && <p>{scheduleStatus}</p>}
        </form>
      </div>
    </div>
  );
}
