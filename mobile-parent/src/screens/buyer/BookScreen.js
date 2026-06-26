import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button } from '../../components/ui';
import { colors } from '../../theme';

export default function BookScreen() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.get('/catalog/services').then(setCatalog);
    if (user?.familyId) {
      api.get(`/families/${user.familyId}/dashboard`).then((d) => setParentId(d.parents[0]?.id));
    }
  }, [user]);

  async function book() {
    if (!selected) return;
    setStatus('');
    try {
      const booking = await api.post('/bookings', { familyId: user.familyId, parentId, serviceCatalogId: selected.id });
      const payment = await api.post('/payments/intent', {
        familyId: user.familyId, amount: selected.price, currency: selected.currency, type: 'one_time', bookingId: booking.id,
      });
      setStatus(`Booked ${selected.name} for ${selected.currency} ${selected.price}. Payment ${payment.status}.`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>Book a service</Text>
      <View style={s.grid}>
        {catalog.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={[s.tile, selected?.id === service.id && s.tileActive]}
            onPress={() => setSelected(service)}
          >
            <Text style={s.tileName}>{service.name}</Text>
            <Text style={s.tilePrice}>{service.currency} {service.price}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Card>
        <CardTitle>Confirm booking</CardTitle>
        <Button onPress={book} disabled={!selected}>Book & pay (mock)</Button>
        {status ? <Text style={s.status}>{status}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18 },
  title: { fontSize: 22, fontWeight: '800', color: colors.stone800, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: { width: '47%', borderWidth: 2, borderColor: colors.stone100, borderRadius: 16, padding: 14, backgroundColor: colors.white },
  tileActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  tileName: { fontSize: 14, fontWeight: '600', color: colors.stone800, marginBottom: 4 },
  tilePrice: { fontSize: 12, color: colors.stone400 },
  status: { marginTop: 10, color: colors.stone600, fontSize: 13 },
});
