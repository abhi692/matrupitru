import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, ErrorBox } from '../../components/ui';
import { colors, radius, shadow } from '../../theme';

const ICONS = {
  visit: 'shield-checkmark-outline',
  vitals_flagged: 'pulse-outline',
  sos: 'warning-outline',
  med_missed: 'medical-outline',
  medication_given: 'medical-outline',
  medication_missed: 'medical-outline',
  rating: 'star-outline',
};

// Single chronological narrative feed — "what happened with my parent" as a
// story, not several screens to mentally merge. Mirrors the web Timeline page.
export default function TimelineScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/timeline`).then(setEvents).catch((err) => setError(err.message));
  }, [user]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Care timeline</Text>
      <ErrorBox>{error}</ErrorBox>
      {!events && !error && <Text style={s.muted}>Loading...</Text>}
      {events?.length === 0 && <Text style={s.muted}>Nothing to show yet.</Text>}
      {events?.map((e) => (
        <Card key={e.id} style={s.card}>
          <View style={s.row}>
            <View style={s.iconWrap}>
              <Ionicons name={ICONS[e.type] || 'ellipse-outline'} size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.summary}>{e.summary}</Text>
              <Text style={s.time}>{new Date(e.at).toLocaleString()}</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  muted: { color: colors.textTertiary, fontSize: 14 },
  card: { marginBottom: 10, paddingVertical: 12 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  iconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', ...shadow },
  summary: { fontSize: 14, color: colors.textPrimary },
  time: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
});
