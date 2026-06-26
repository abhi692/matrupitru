import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { Card, Badge, Button, Input, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors } from '../../theme';

const STATUS_BADGE = { verified: 'success', pending: 'warning', rejected: 'danger' };

export default function CaregiversScreen() {
  const [caregivers, setCaregivers] = useState([]);
  const [cityDraft, setCityDraft] = useState({});
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/caregivers').then(setCaregivers).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function setVerification(id, status) {
    await api.patch(`/admin/caregivers/${id}/verification`, { status });
    load();
  }

  async function saveCoverage(id) {
    const cities = (cityDraft[id] ?? '').split(',').map((c) => c.trim()).filter(Boolean);
    await api.patch(`/admin/caregivers/${id}/coverage`, { cities });
    load();
  }

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <ScreenTitle>Caregivers</ScreenTitle>
      <ErrorBox>{error}</ErrorBox>

      {caregivers.length === 0 ? (
        <Card><EmptyState icon="people-outline" text="No caregivers yet." /></Card>
      ) : (
        caregivers.map((c) => (
          <Card key={c.id}>
            <View style={s.headRow}>
              <Text style={s.name}>{c.user.name}</Text>
              <Badge variant={STATUS_BADGE[c.verificationStatus]}>{c.verificationStatus}</Badge>
            </View>
            <Text style={s.phone}>{c.user.phone}</Text>
            <View style={s.btnRow}>
              <Button variant="subtle" onPress={() => setVerification(c.id, 'verified')}>Verify</Button>
              <Button variant="outline" onPress={() => setVerification(c.id, 'pending')}>Pending</Button>
              <Button variant="outline" onPress={() => setVerification(c.id, 'rejected')}>Reject</Button>
            </View>
            <View style={s.coverageRow}>
              <Input
                style={{ flex: 1, marginBottom: 0 }}
                defaultValue={JSON.parse(c.serviceCitiesJson || '[]').join(', ')}
                onChangeText={(v) => setCityDraft({ ...cityDraft, [c.id]: v })}
                placeholder="Cities, comma separated"
              />
              <Button onPress={() => saveCoverage(c.id)}>Save</Button>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  phone: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  btnRow: { flexDirection: 'row', gap: 6, marginTop: 12 },
  coverageRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
});
