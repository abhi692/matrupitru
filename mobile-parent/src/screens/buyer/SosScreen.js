import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, CardDescription, Badge, Button, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors, radius } from '../../theme';

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
      <ScreenTitle>SOS</ScreenTitle>
      <Card style={{ backgroundColor: colors.dangerSoft }}>
        <CardTitle icon="alert" style={{ color: colors.danger }}>Emergency</CardTitle>
        <CardDescription>Notifies the Care Manager and you, and dispatches the nearest caregiver.</CardDescription>
        <Button variant="emergency" onPress={raiseSos} icon="warning" style={{ paddingVertical: 18 }}>Raise SOS now</Button>
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
        <CardTitle icon="time-outline">Alert history</CardTitle>
        {alerts.length === 0 ? <EmptyState icon="checkmark-circle-outline" text="No alerts yet." /> : (
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
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  resultBox: { backgroundColor: colors.successSoft, borderRadius: radius.control, padding: 12, marginTop: 10 },
  resultText: { color: colors.accentDark, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.separator },
  rowText: { fontSize: 14, color: colors.textPrimary, textTransform: 'capitalize' },
});
