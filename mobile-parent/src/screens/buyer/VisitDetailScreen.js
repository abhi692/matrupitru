import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { Card, CardTitle, Badge, ErrorBox } from '../../components/ui';
import { colors } from '../../theme';

export default function VisitDetailScreen({ route }) {
  const { visitId } = route.params;
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/visits/${visitId}`).then(setVisit).catch((e) => setError(e.message));
  }, [visitId]);

  if (error) return <View style={s.content}><ErrorBox>{error}</ErrorBox></View>;
  if (!visit) return <View style={s.content}><Text style={s.muted}>Loading...</Text></View>;

  const checklist = JSON.parse(visit.taskChecklistJson || '[]');

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Card>
        <View style={s.headRow}>
          <CardTitle>Visit — {visit.type}</CardTitle>
          <Badge variant="brand">{visit.status}</Badge>
        </View>
        <Text style={s.line}>Caregiver: {visit.caregiver?.name || 'Unassigned'}</Text>
        <Text style={s.line}>Check-in: {visit.checkInAt ? new Date(visit.checkInAt).toLocaleString() : '—'}</Text>
        <Text style={s.line}>Check-out: {visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleString() : '—'}</Text>
        <Text style={s.line}>Parent confirmed: {visit.parentConfirmedAt ? new Date(visit.parentConfirmedAt).toLocaleString() : 'Not yet'}</Text>

        <View style={[s.flag, { backgroundColor: visit.geoVerified ? colors.brand50 : colors.warm50 }]}>
          <Text style={{ color: visit.geoVerified ? colors.brand700 : colors.warm600, fontWeight: '700' }}>
            {visit.geoVerified ? 'Geo-verified — caregiver confirmed at home address' : 'Not geo-verified — flagged for ops review'}
          </Text>
        </View>

        <Text style={s.sectionTitle}>Task checklist</Text>
        {checklist.map((t, i) => (
          <Text key={i} style={s.checklistItem}>{t.done ? '✅' : '⬜'} {t.task}</Text>
        ))}

        <Text style={s.sectionTitle}>Proof artifacts</Text>
        {visit.proofs.length === 0 ? <Text style={s.muted}>No proof uploaded yet.</Text> : (
          visit.proofs.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => p.storageUrl && Linking.openURL(p.storageUrl)}>
              <Text style={s.proofLine}>{p.type} — {new Date(p.capturedAt).toLocaleString()} {p.storageUrl ? '(view)' : ''}</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  line: { fontSize: 14, color: colors.stone700, marginBottom: 4 },
  flag: { borderRadius: 10, padding: 12, marginVertical: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.stone700, marginTop: 14, marginBottom: 6 },
  checklistItem: { fontSize: 14, color: colors.stone700, marginBottom: 4 },
  proofLine: { fontSize: 13, color: colors.brand600, marginBottom: 4 },
  muted: { color: colors.stone400, fontSize: 14 },
});
