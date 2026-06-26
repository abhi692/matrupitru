import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors } from '../../theme';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    api.get(`/visits?caregiverId=${user.id}`).then((vs) => {
      setVisits(vs.filter((v) => v.status === 'completed').sort((a, b) => new Date(b.checkOutAt) - new Date(a.checkOutAt)));
    }).catch((e) => setError(e.message));
  }

  useEffect(() => { refresh(); }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ScreenTitle>History</ScreenTitle>
      <ErrorBox>{error}</ErrorBox>

      {visits.length === 0 ? (
        <Card><EmptyState icon="time-outline" text="No completed visits yet." /></Card>
      ) : visits.map((v) => (
        <Card key={v.id}>
          <View style={s.headRow}>
            <Text style={s.type}>{v.type} — {v.parent.user.name}</Text>
            <Badge variant={v.geoVerified ? 'success' : 'warning'}>{v.geoVerified ? 'Verified' : 'Flagged'}</Badge>
          </View>
          <Text style={s.time}>{new Date(v.checkOutAt).toLocaleString()}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  time: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
});
