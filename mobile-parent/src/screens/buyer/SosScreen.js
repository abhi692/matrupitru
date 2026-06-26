import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, CardDescription, Badge, Button, ErrorBox } from '../../components/ui';
import { colors } from '../../theme';

export default function SosScreen() {
  const { user } = useAuth();
  const [parentId, setParentId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  function refreshAlerts() {
    if (!user?.familyId) return;
    api.get(`/alerts?family=${user.familyId}`).then(setAlerts).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/dashboard`).then((d) => setParentId(d.parents[0]?.id));
    refreshAlerts();
  }, [user]);

  async function raiseSos() {
    if (!parentId) return;
    setError('');
    try {
      const r = await api.post(`/parents/${parentId}/sos`, {});
      setResult(r);
      refreshAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Card style={{ borderColor: colors.rose50, borderWidth: 1 }}>
        <CardTitle style={{ color: colors.rose700 }}>Emergency (SOS)</CardTitle>
        <CardDescription>
          Raising this notifies the Care Manager and you across channels, and dispatches the
          nearest available caregiver.
        </CardDescription>
        <Button variant="emergency" onPress={raiseSos} style={{ paddingVertical: 18 }}>
          🚨  Raise SOS now
        </Button>
        <ErrorBox>{error}</ErrorBox>
        {result && (
          <View style={s.resultBox}>
            <Text style={s.resultText}>
              Alert raised. Care Manager notified: {result.notified.careManager ? 'yes' : 'no'}.
              {result.dispatchedCaregiver ? ` Nearest caregiver dispatched: ${result.dispatchedCaregiver.name}.` : ''}
            </Text>
          </View>
        )}
      </Card>

      <Card>
        <CardTitle>Alert history</CardTitle>
        {alerts.length === 0 ? <Text style={s.muted}>No alerts yet.</Text> : (
          alerts.map((a) => (
            <View key={a.id} style={s.row}>
              <Text style={s.rowText}>{a.type.replace(/_/g, ' ')}</Text>
              <Badge variant={a.severity === 'emergency' ? 'danger' : 'warning'}>{a.severity}</Badge>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18 },
  muted: { color: colors.stone400, fontSize: 14 },
  resultBox: { backgroundColor: colors.brand50, borderRadius: 10, padding: 12, marginTop: 10 },
  resultText: { color: colors.brand700, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.stone100 },
  rowText: { fontSize: 14, color: colors.stone700, textTransform: 'capitalize' },
});
