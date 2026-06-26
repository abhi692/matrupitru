import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { Card, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors } from '../../theme';

export default function AuditScreen() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/audit').then(setEvents).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ScreenTitle>Audit log</ScreenTitle>
      <ErrorBox>{error}</ErrorBox>
      <Card>
        {events.length === 0 ? <EmptyState icon="document-text-outline" text="No events yet." /> : (
          events.map((e) => (
            <View key={e.id} style={s.row}>
              <Text style={s.type}>{e.type}</Text>
              <Text style={s.time}>{new Date(e.createdAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.separator },
  type: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  time: { fontSize: 11, color: colors.textTertiary },
});
