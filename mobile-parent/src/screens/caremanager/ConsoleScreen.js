import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Badge, Button, Input, Label, ErrorBox } from '../../components/ui';
import Select from '../../components/Select';
import ChatPanel from '../../components/ChatPanel';
import { colors } from '../../theme';

export default function ConsoleScreen() {
  const { logout } = useAuth();
  const [families, setFamilies] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [schedulesByParent, setSchedulesByParent] = useState({});
  const [error, setError] = useState('');

  const [visitForm, setVisitForm] = useState({ parentId: '', caregiverId: '', type: 'attendant' });
  const [visitStatus, setVisitStatus] = useState('');
  const [medForm, setMedForm] = useState({ parentId: '', medication: '', timesOfDay: '08:00' });
  const [medStatus, setMedStatus] = useState('');
  const [activeFamilyId, setActiveFamilyId] = useState('');
  const [activeThreadId, setActiveThreadId] = useState(null);

  function refresh() {
    api.get('/families').then((fams) => {
      setFamilies(fams);
      fams.flatMap((f) => f.parents).forEach((p) => {
        api.get(`/parents/${p.id}/medication-schedules`).then((s) => setSchedulesByParent((m) => ({ ...m, [p.id]: s })));
      });
    }).catch((e) => setError(e.message));
    api.get('/alerts').then(setAlerts).catch((e) => setError(e.message));
    api.get('/caregivers').then(setCaregivers).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  const allParents = families.flatMap((f) => f.parents.map((p) => ({ ...p, familyName: f.users.find((u) => u.role === 'buyer')?.name })));
  const openAlerts = alerts.filter((a) => !a.acknowledgedAt);

  async function acknowledge(id) {
    await api.patch(`/alerts/${id}/acknowledge`, { resolution: 'Acknowledged by Care Manager' });
    refresh();
  }

  async function scheduleVisit() {
    setVisitStatus('');
    try {
      await api.post('/visits', {
        parentId: visitForm.parentId,
        caregiverId: visitForm.caregiverId || undefined,
        type: visitForm.type,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        taskChecklist: [],
      });
      setVisitStatus('Visit scheduled for 1 hour from now.');
    } catch (err) {
      setVisitStatus(`Error: ${err.message}`);
    }
  }

  async function scheduleMedication() {
    setMedStatus('');
    try {
      const timesOfDay = medForm.timesOfDay.split(',').map((t) => t.trim()).filter(Boolean);
      await api.post(`/parents/${medForm.parentId}/medication-schedules`, { medication: medForm.medication, timesOfDay, gracePeriodMinutes: 15 });
      setMedStatus(`Set up — fires automatically every day at ${timesOfDay.join(', ')}.`);
      refresh();
    } catch (err) {
      setMedStatus(`Error: ${err.message}`);
    }
  }

  async function openThread(familyId) {
    setActiveFamilyId(familyId);
    const thread = await api.get(`/families/${familyId}/thread`);
    setActiveThreadId(thread.id);
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.headRow}>
        <Text style={s.title}>Care Manager Console</Text>
        <Text onPress={logout} style={s.logout}>Log out</Text>
      </View>
      <ErrorBox>{error}</ErrorBox>

      <Card style={openAlerts.length > 0 ? { borderColor: colors.warm200, borderWidth: 1 } : null}>
        <CardTitle>Alert queue</CardTitle>
        {openAlerts.length === 0 ? <Text style={s.muted}>No open alerts.</Text> : openAlerts.map((a) => (
          <View key={a.id} style={s.alertRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>{a.type.replace(/_/g, ' ')}</Text>
              <Badge variant={a.severity === 'emergency' ? 'danger' : 'warning'}>{a.severity}</Badge>
            </View>
            <Button variant="subtle" onPress={() => acknowledge(a.id)}>Ack</Button>
          </View>
        ))}
      </Card>

      <Card>
        <CardTitle>Family roster</CardTitle>
        {families.map((f) => (
          <View key={f.id} style={s.familyBlock}>
            <Text style={s.familyName}>{f.users.find((u) => u.role === 'buyer')?.name || 'Family'}</Text>
            {f.parents.map((p) => (
              <Text key={p.id} style={s.muted}>· {p.user.name} — {p.address}</Text>
            ))}
          </View>
        ))}
      </Card>

      <Card>
        <CardTitle>Messages</CardTitle>
        <Select
          value={activeFamilyId}
          onValueChange={openThread}
          placeholder="Select a family to message"
          items={families.map((f) => ({ value: f.id, label: f.users.find((u) => u.role === 'buyer')?.name || 'Family' }))}
        />
        {activeThreadId && <ChatPanel threadId={activeThreadId} />}
      </Card>

      <Card>
        <CardTitle>Medication reminder (recurring, automatic)</CardTitle>
        <Label>Parent</Label>
        <Select value={medForm.parentId} onValueChange={(v) => setMedForm({ ...medForm, parentId: v })} items={allParents.map((p) => ({ value: p.id, label: `${p.user.name} (${p.familyName})` }))} />
        <Label>Medication</Label>
        <Input value={medForm.medication} onChangeText={(v) => setMedForm({ ...medForm, medication: v })} placeholder="Amlodipine 5mg" />
        <Label>Daily times (comma separated, HH:MM)</Label>
        <Input value={medForm.timesOfDay} onChangeText={(v) => setMedForm({ ...medForm, timesOfDay: v })} placeholder="08:00, 20:00" />
        <Button onPress={scheduleMedication}>Set up automatic reminder</Button>
        {medStatus ? <Text style={s.status}>{medStatus}</Text> : null}
      </Card>

      <Card>
        <CardTitle>Schedule a visit</CardTitle>
        <Label>Parent</Label>
        <Select value={visitForm.parentId} onValueChange={(v) => setVisitForm({ ...visitForm, parentId: v })} items={allParents.map((p) => ({ value: p.id, label: `${p.user.name} (${p.familyName})` }))} />
        <Label>Caregiver</Label>
        <Select value={visitForm.caregiverId} onValueChange={(v) => setVisitForm({ ...visitForm, caregiverId: v })} placeholder="Unassigned" items={caregivers.map((c) => ({ value: c.userId, label: c.user.name }))} />
        <Label>Visit type</Label>
        <Select value={visitForm.type} onValueChange={(v) => setVisitForm({ ...visitForm, type: v })} items={['attendant', 'nurse', 'doctor', 'physio', 'errand'].map((t) => ({ value: t, label: t }))} />
        <Button onPress={scheduleVisit}>Schedule (1 hour from now)</Button>
        {visitStatus ? <Text style={s.status}>{visitStatus}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 54, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: colors.brand700 },
  logout: { color: colors.stone500, fontSize: 13 },
  muted: { color: colors.stone400, fontSize: 13 },
  rowText: { fontSize: 14, color: colors.stone700, textTransform: 'capitalize', marginBottom: 4 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.stone100 },
  familyBlock: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.stone100 },
  familyName: { fontWeight: '700', color: colors.stone800, marginBottom: 2 },
  status: { marginTop: 10, color: colors.stone600, fontSize: 13 },
});
