import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, ErrorBox, ScreenTitle } from '../../components/ui';
import { colors, radius } from '../../theme';

export default function OverviewScreen() {
  const { logout } = useAuth();
  const [sla, setSla] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.get('/admin/sla').then(setSla).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.headRow}>
        <ScreenTitle>Overview</ScreenTitle>
        <Text onPress={logout} style={s.logout}>Log out</Text>
      </View>
      <ErrorBox>{error}</ErrorBox>

      <Card>
        <CardTitle icon="stats-chart-outline">SLA & success metrics</CardTitle>
        {sla && (
          <View style={s.grid}>
            <Metric label="Geo-verified rate" value={sla.geoVerifiedRate != null ? `${sla.geoVerifiedRate}%` : '—'} />
            <Metric label="Missed-visit rate" value={sla.missedVisitRate != null ? `${sla.missedVisitRate}%` : '—'} warn={sla.missedVisitRate > 10} />
            <Metric label="Avg SOS ack" value={sla.avgSosAckSeconds != null ? `${sla.avgSosAckSeconds}s` : '—'} warn={sla.avgSosAckSeconds > 60} />
            <Metric label="Total visits" value={sla.totalVisits} />
            <Metric label="Families" value={sla.totalFamilies} />
            <Metric label="Active (30d)" value={sla.activeParents30d} />
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value, warn }) {
  return (
    <View style={[s.metric, warn && { backgroundColor: colors.warningSoft }]}>
      <Text style={[s.metricValue, warn && { color: colors.warning }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logout: { color: colors.textTertiary, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '30.5%', backgroundColor: colors.surfaceAlt, borderRadius: radius.control, padding: 12 },
  metricValue: { fontSize: 20, fontWeight: '800', color: colors.accentDark },
  metricLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 3 },
});
