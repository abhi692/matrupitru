import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, CardDescription, Button, Input, Label, Badge } from '../../components/ui';
import { colors } from '../../theme';

export default function BillingScreen() {
  const { user } = useAuth();
  const [subs, setSubs] = useState([]);
  const [amount, setAmount] = useState('99');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (user?.familyId) api.get(`/families/${user.familyId}/subscriptions`).then(setSubs);
  }, [user]);

  async function subscribe() {
    setStatus('');
    try {
      const sub = await api.post('/subscriptions', { familyId: user.familyId, amount: Number(amount), currency: 'USD' });
      setSubs((s) => [sub, ...s]);
      setStatus('Subscription active (mock gateway).');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Card>
        <CardTitle>Billing & subscription</CardTitle>
        <CardDescription>International cards / UPI are mocked for this build.</CardDescription>
        <Label>Monthly amount (USD)</Label>
        <Input value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Button onPress={subscribe}>Subscribe</Button>
        {status ? <Text style={s.status}>{status}</Text> : null}
      </Card>

      <Card>
        <CardTitle>Subscription history</CardTitle>
        {subs.length === 0 ? <Text style={s.muted}>No subscriptions yet.</Text> : subs.map((sub) => (
          <View key={sub.id} style={s.row}>
            <Text style={s.rowText}>{sub.currency} {sub.amount}/mo</Text>
            <Badge variant="success">{sub.status}</Badge>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18 },
  muted: { color: colors.stone400, fontSize: 14 },
  status: { marginTop: 10, color: colors.stone600, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.stone100 },
  rowText: { fontSize: 14, color: colors.stone700 },
});
