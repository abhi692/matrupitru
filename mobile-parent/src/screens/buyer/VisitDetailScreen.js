import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { Card, CardTitle, Badge, ErrorBox } from '../../components/ui';
import { colors, radius } from '../../theme';

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
          <CardTitle>{visit.type} visit</CardTitle>
          <Badge variant="brand">{visit.status}</Badge>
        </View>
        <Text style={s.line}>Caregiver: {visit.caregiver?.name || 'Unassigned'}</Text>
        <Text style={s.line}>Check-in: {visit.checkInAt ? new Date(visit.checkInAt).toLocaleString() : '—'}</Text>
        <Text style={s.line}>Check-out: {visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleString() : '—'}</Text>
        <Text style={s.line}>Parent confirmed: {visit.parentConfirmedAt ? new Date(visit.parentConfirmedAt).toLocaleString() : 'Not yet'}</Text>

        <View style={[s.flag, { backgroundColor: visit.geoVerified ? colors.successSoft : colors.warningSoft }]}>
          <Ionicons name={visit.geoVerified ? 'shield-checkmark' : 'shield-half'} size={16} color={visit.geoVerified ? colors.accentDark : colors.warning} />
          <Text style={{ color: visit.geoVerified ? colors.accentDark : colors.warning, fontWeight: '600', flex: 1 }}>
            {visit.geoVerified ? 'Geo-verified at home address' : 'Not geo-verified — flagged'}
          </Text>
        </View>

        <Text style={s.sectionTitle}>Task checklist</Text>
        {checklist.map((t, i) => (
          <View key={i} style={s.checkRow}>
            <Ionicons name={t.done ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={t.done ? colors.accent : colors.textTertiary} />
            <Text style={s.checklistItem}>{t.task}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>Proof artifacts</Text>
        {visit.proofs.length === 0 ? <Text style={s.muted}>No proof uploaded yet.</Text> : (
          visit.proofs.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => p.storageUrl && Linking.openURL(p.storageUrl)} style={s.proofRow}>
              <Ionicons name="image-outline" size={15} color={colors.accent} />
              <Text style={s.proofLine}>{p.type} — {new Date(p.capturedAt).toLocaleString()}</Text>
            </TouchableOpacity>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 18 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  line: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.control, padding: 12, marginVertical: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  checklistItem: { fontSize: 14, color: colors.textPrimary },
  proofRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  proofLine: { fontSize: 13, color: colors.accentDark },
  muted: { color: colors.textTertiary, fontSize: 14 },
});
