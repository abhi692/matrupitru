import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Badge, Button, ErrorBox } from '../../components/ui';
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
      if (parentId) {
        const m = await api.get(`/parents/${parentId}/medications`);
        setMeds(m);
      }
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
        <Text style={s.muted}>No family set up yet. Onboarding from mobile isn't built — use the website to onboard a parent first, then come back here.</Text>
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
          {parent?.address ? <Text style={s.muted}>{parent.address}</Text> : null}
        </View>
        <TouchableOpacity onPress={logout}><Text style={s.logout}>Log out</Text></TouchableOpacity>
      </View>

      {data.openAlerts.length > 0 && (
        <Card style={{ borderColor: colors.warm200, borderWidth: 1 }}>
          <CardTitle style={{ color: colors.warm600 }}>Open alerts</CardTitle>
          {data.openAlerts.map((a) => (
            <View key={a.id} style={s.row}>
              <Text style={s.rowText}>{a.type.replace(/_/g, ' ')}</Text>
              <Badge variant="warning">{a.severity}</Badge>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <CardTitle>Upcoming visits</CardTitle>
        {data.upcomingVisits.length === 0 ? <Text style={s.muted}>No visits scheduled.</Text> : (
          data.upcomingVisits.map((v) => (
            <View key={v.id} style={s.row}>
              <Text style={s.rowText}>{v.type}</Text>
              <Text style={s.rowSub}>{new Date(v.scheduledAt).toLocaleString()}</Text>
            </View>
          ))
        )}
      </Card>

      <Card>
        <CardTitle>Recent activity — proof of care</CardTitle>
        {data.recentVisits.length === 0 ? <Text style={s.muted}>No completed visits yet.</Text> : (
          data.recentVisits.map((v) => (
            <TouchableOpacity key={v.id} style={s.row} onPress={() => navigation.navigate('VisitDetail', { visitId: v.id })}>
              <Text style={s.rowText}>{v.type}</Text>
              <Badge variant={v.geoVerified ? 'success' : 'warning'}>{v.geoVerified ? 'Geo-verified' : 'Not verified'}</Badge>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {meds.length > 0 && (
        <Card>
          <CardTitle>Medication adherence</CardTitle>
          {meds.slice(0, 6).map((m) => (
            <View key={m.id} style={s.row}>
              <Text style={s.rowText}>{m.medication}</Text>
              <Badge variant={m.status === 'given' ? 'success' : m.status === 'missed' ? 'danger' : m.status === 'due' ? 'warning' : 'neutral'}>{m.status}</Badge>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <CardTitle>Care plan</CardTitle>
        <Text style={s.muted}>Tier: {data.carePlan?.tier?.replace(/_/g, ' ') || 'none'}</Text>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 54, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  parentName: { fontSize: 24, fontWeight: '800', color: colors.stone800 },
  logout: { color: colors.stone500, fontSize: 13 },
  muted: { color: colors.stone400, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.stone100 },
  rowText: { fontSize: 14, color: colors.stone700, textTransform: 'capitalize' },
  rowSub: { fontSize: 12, color: colors.stone400 },
});
