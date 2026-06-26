import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { Card, Badge, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors } from '../../theme';

export default function FamiliesScreen() {
  const [families, setFamilies] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.get('/families').then(setFamilies).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ScreenTitle>Families</ScreenTitle>
      <ErrorBox>{error}</ErrorBox>

      {families.length === 0 ? (
        <Card><EmptyState icon="people-outline" text="No families yet." /></Card>
      ) : (
        families.map((f) => (
          <Card key={f.id}>
            <View style={s.headRow}>
              <Text style={s.familyName}>{f.users.find((u) => u.role === 'buyer')?.name || 'Family'}</Text>
              <Badge variant="brand">{f.carePlan?.tier?.replace(/_/g, ' ') || 'no plan'}</Badge>
            </View>
            {f.parents.map((p) => (
              <View key={p.id} style={s.parentRow}>
                <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                <Text style={s.parentText}>{p.user.name} — {p.address}</Text>
              </View>
            ))}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  familyName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  parentText: { fontSize: 13, color: colors.textSecondary },
});
