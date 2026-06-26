import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Button, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors } from '../../theme';

export default function AlertsScreen() {
  const { logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.get('/alerts').then(setAlerts).catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function acknowledge(id) {
    await api.patch(`/alerts/${id}/acknowledge`, { resolution: 'Acknowledged by Care Manager' });
    load();
  }

  const open = alerts.filter((a) => !a.acknowledgedAt);
  const resolved = alerts.filter((a) => a.acknowledgedAt).slice(0, 10);

  return (
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.headRow}>
        <ScreenTitle>Alerts</ScreenTitle>
        <Text onPress={logout} style={s.logout}>Log out</Text>
      </View>
      <ErrorBox>{error}</ErrorBox>

      {open.length === 0 ? (
        <Card><EmptyState icon="checkmark-done-circle-outline" text="No open alerts — all caught up." /></Card>
      ) : (
        open.map((a) => (
          <Card key={a.id}>
            <View style={s.alertRow}>
              <View style={{ flex: 1 }}>
                <Badge variant={a.severity === 'emergency' ? 'danger' : 'warning'}>{a.severity}</Badge>
                <Text style={s.alertType}>{a.type.replace(/_/g, ' ')}</Text>
                <Text style={s.alertTime}>{new Date(a.triggeredAt).toLocaleString()}</Text>
              </View>
              <Button variant="subtle" onPress={() => acknowledge(a.id)}>Acknowledge</Button>
            </View>
          </Card>
        ))
      )}

      {resolved.length > 0 && (
        <View style={s.resolvedSection}>
          <Text style={s.resolvedHeading}>Recently resolved</Text>
          {resolved.map((a) => (
            <View key={a.id} style={s.resolvedRow}>
              <Text style={s.resolvedType}>{a.type.replace(/_/g, ' ')}</Text>
              <Text style={s.resolvedTime}>{new Date(a.acknowledgedAt).toLocaleTimeString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  logout: { color: colors.textTertiary, fontSize: 13 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  alertType: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 6, textTransform: 'capitalize' },
  alertTime: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  resolvedSection: { marginTop: 8 },
  resolvedHeading: { fontSize: 12, fontWeight: '600', color: colors.textTertiary, marginBottom: 8, textTransform: 'uppercase' },
  resolvedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.separator },
  resolvedType: { fontSize: 13, color: colors.textSecondary, textTransform: 'capitalize' },
  resolvedTime: { fontSize: 12, color: colors.textTertiary },
});
