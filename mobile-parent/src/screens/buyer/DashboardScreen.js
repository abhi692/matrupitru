import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Badge, Button, ErrorBox, EmptyState } from '../../components/ui';
import { colors } from '../../theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [meds, setMeds] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user?.familyId) return;
    try {
      const d = await api.get(`/families/${user.familyId}/dashboard`);
      setData(d);
      const parentId = d.parents[0]?.id;
      if (parentId) setMeds(await api.get(`/parents/${parentId}/medications`));
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  if (!user?.familyId) {
    return (
      <ScrollView contentContainerStyle={s.content}>
        <Card><EmptyState icon="person-add-outline" text="No family set up yet. Onboard a parent from the website first." /></Card>
      </ScrollView>
    );
  }

  if (error) return <ScrollView contentContainerStyle={s.content}><ErrorBox>{error}</ErrorBox></ScrollView>;
  if (!data) return <ScrollView contentContainerStyle={s.content}><Text style={s.muted}>Loading...</Text></ScrollView>;

  const parent = data.parents[0];

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.headRow}>
        <View>
          <Text style={s.parentName}>{parent ? parent.user.name : 'Your parent'}</Text>
          {parent?.address ? (
            <View style={s.addrRow}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text style={s.muted}>{parent.address}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity onPress={logout}><Text style={s.logout}>Log out</Text></TouchableOpacity>
      </View>

      {data.openAlerts.length > 0 && (
        <Card style={{ backgroundColor: colors.warningSoft }}>
          <CardTitle icon="alert-circle-outline" style={{ color: colors.warning }}>Open alerts</CardTitle>
          {data.openAlerts.map((a) => (
            <View key={a.id} style={s.row}>
              <Text style={s.rowText}>{a.type.replace(/_/g, ' ')}</Text>
              <Badge variant="warning">{a.severity}</Badge>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <CardTitle icon="calendar-outline">Upcoming visits</CardTitle>
        {data.upcomingVisits.length === 0 ? <EmptyState icon="calendar-outline" text="No visits scheduled." /> : (
          data.upcomingVisits.map((v) => (
            <View key={v.id} style={s.row}>
              <Text style={s.rowText}>{v.type}</Text>
              <Text style={s.rowSub}>{new Date(v.scheduledAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardTitle icon="shield-checkmark-outline">Proof of care</CardTitle>
        {data.recentVisits.length === 0 ? <EmptyState icon="image-outline" text="No completed visits yet." /> : (
          data.recentVisits.map((v) => (
            <TouchableOpacity key={v.id} style={s.row} onPress={() => navigation.navigate('VisitDetail', { visitId: v.id })} activeOpacity={0.6}>
              <Text style={s.rowText}>{v.type}</Text>
              <Badge variant={v.geoVerified ? 'success' : 'warning'}>{v.geoVerified ? 'Verified' : 'Not verified'}</Badge>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {meds.length > 0 && (
        <Card>
          <CardTitle icon="medical-outline">Medication adherence</CardTitle>
          {meds.slice(0, 6).map((m) => (
            <View key={m.id} style={s.row}>
              <Text style={s.rowText}>{m.medication}</Text>
              <Badge variant={m.status === 'given' ? 'success' : m.status === 'missed' ? 'danger' : m.status === 'due' ? 'warning' : 'neutral'}>{m.status}</Badge>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <CardTitle icon="ribbon-outline">Care plan</CardTitle>
        <Text style={s.muted}>Tier: {data.carePlan?.tier?.replace(/_/g, ' ') || 'none'}</Text>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  parentName: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  logout: { color: colors.textTertiary, fontSize: 13 },
  muted: { color: colors.textTertiary, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.separator },
  rowText: { fontSize: 14, color: colors.textPrimary, textTransform: 'capitalize' },
  rowSub: { fontSize: 12, color: colors.textTertiary },
});
