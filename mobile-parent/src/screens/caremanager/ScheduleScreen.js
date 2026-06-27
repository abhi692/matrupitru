import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { Card, CardTitle, Button, Input, Label, ErrorBox, ScreenTitle } from '../../components/ui';
import Select from '../../components/Select';
import TimeListPicker from '../../components/TimeListPicker';
import DateTimeField from '../../components/DateTimeField';
import { colors } from '../../theme';

function defaultVisitTime() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  return d;
}

export default function ScheduleScreen() {
  const [families, setFamilies] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [error, setError] = useState('');

  const [visitForm, setVisitForm] = useState({ parentId: '', caregiverId: '', type: 'attendant', scheduledAt: defaultVisitTime() });
  const [visitStatus, setVisitStatus] = useState('');
  const [medForm, setMedForm] = useState({ parentId: '', medication: '', timesOfDay: ['08:00'] });
  const [medStatus, setMedStatus] = useState('');

  const load = useCallback(() => {
    api.get('/families').then(setFamilies).catch((e) => setError(e.message));
    api.get('/caregivers').then(setCaregivers).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  const allParents = families.flatMap((f) => f.parents.map((p) => ({ ...p, familyName: f.users.find((u) => u.role === 'buyer')?.name })));

  async function scheduleVisit() {
    setVisitStatus('');
    try {
      await api.post('/visits', {
        parentId: visitForm.parentId,
        caregiverId: visitForm.caregiverId || undefined,
        type: visitForm.type,
        scheduledAt: visitForm.scheduledAt.toISOString(),
        taskChecklist: [],
      });
      setVisitStatus(`✓ Scheduled for ${visitForm.scheduledAt.toLocaleString()}.`);
    } catch (err) {
      setVisitStatus(`Error: ${err.message}`);
    }
  }

  async function scheduleMedication() {
    setMedStatus('');
    if (medForm.timesOfDay.length === 0) {
      setMedStatus('Error: add at least one time.');
      return;
    }
    try {
      await api.post(`/parents/${medForm.parentId}/medication-schedules`, {
        medication: medForm.medication, timesOfDay: medForm.timesOfDay, gracePeriodMinutes: 15,
      });
      setMedStatus(`✓ Fires automatically every day at ${medForm.timesOfDay.join(', ')}.`);
    } catch (err) {
      setMedStatus(`Error: ${err.message}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <ScreenTitle>Schedule</ScreenTitle>
      <ErrorBox>{error}</ErrorBox>

      <Card>
        <CardTitle icon="alarm-outline">Medication reminder</CardTitle>
        <Text style={s.helper}>Set once — fires automatically every day, no re-entering.</Text>
        <Label>Parent</Label>
        <Select value={medForm.parentId} onValueChange={(v) => setMedForm({ ...medForm, parentId: v })} items={allParents.map((p) => ({ value: p.id, label: `${p.user.name} (${p.familyName})` }))} />
        <Label>Medication</Label>
        <Input value={medForm.medication} onChangeText={(v) => setMedForm({ ...medForm, medication: v })} placeholder="Amlodipine 5mg" placeholderTextColor={colors.textTertiary} />
        <Label>Daily times</Label>
        <TimeListPicker times={medForm.timesOfDay} onChange={(v) => setMedForm({ ...medForm, timesOfDay: v })} />
        <Button onPress={scheduleMedication} icon="add-circle-outline" style={{ marginTop: 8 }}>Set up reminder</Button>
        {medStatus ? <Text style={s.status}>{medStatus}</Text> : null}
      </Card>

      <Card>
        <CardTitle icon="calendar-outline">Schedule a visit</CardTitle>
        <Label>Parent</Label>
        <Select value={visitForm.parentId} onValueChange={(v) => setVisitForm({ ...visitForm, parentId: v })} items={allParents.map((p) => ({ value: p.id, label: `${p.user.name} (${p.familyName})` }))} />
        <Label>Caregiver</Label>
        <Select value={visitForm.caregiverId} onValueChange={(v) => setVisitForm({ ...visitForm, caregiverId: v })} placeholder="Unassigned" items={caregivers.map((c) => ({ value: c.userId, label: c.user.name }))} />
        <Label>Visit type</Label>
        <Select value={visitForm.type} onValueChange={(v) => setVisitForm({ ...visitForm, type: v })} items={['attendant', 'nurse', 'doctor', 'physio', 'errand'].map((t) => ({ value: t, label: t }))} />
        <Label>Date &amp; time</Label>
        <DateTimeField value={visitForm.scheduledAt} onChange={(v) => setVisitForm({ ...visitForm, scheduledAt: v })} />
        <Button onPress={scheduleVisit} icon="add-circle-outline" style={{ marginTop: 8 }}>Schedule visit</Button>
        {visitStatus ? <Text style={s.status}>{visitStatus}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  helper: { fontSize: 12, color: colors.textTertiary, marginBottom: 4 },
  status: { marginTop: 10, color: colors.accentDark, fontSize: 13, fontWeight: '500' },
});
