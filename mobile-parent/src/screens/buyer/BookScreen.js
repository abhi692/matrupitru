import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Button, ScreenTitle } from '../../components/ui';
import { colors, radius, shadow } from '../../theme';

const ICONS = {
  'doctor-visit': 'medkit-outline',
  physio: 'fitness-outline',
  'attendant-day': 'person-outline',
  diagnostics: 'flask-outline',
  medicines: 'medical-outline',
  errand: 'bag-outline',
};

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
      setStatus(`✓ Booked ${selected.name} for ${selected.currency} ${selected.price}.`);
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <ScreenTitle>Book a service</ScreenTitle>
      <View style={s.grid}>
        {catalog.map((service) => {
          const active = selected?.id === service.id;
          return (
            <TouchableOpacity
              key={service.id}
              style={[s.tile, active && s.tileActive]}
              onPress={() => setSelected(service)}
              activeOpacity={0.7}
            >
              <View style={[s.iconCircle, active && { backgroundColor: colors.accent }]}>
                <Ionicons name={ICONS[service.id] || 'ellipse-outline'} size={18} color={active ? colors.white : colors.accent} />
              </View>
              <Text style={s.tileName}>{service.name}</Text>
              <Text style={s.tilePrice}>{service.currency} {service.price}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Card>
        <CardTitle icon="checkmark-done-outline">Confirm booking</CardTitle>
        <Button onPress={book} disabled={!selected}>Book & pay (mock)</Button>
        {status ? <Text style={s.status}>{status}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  tile: { width: '47%', borderRadius: radius.card, padding: 14, backgroundColor: colors.surface, ...shadow },
  tileActive: { backgroundColor: colors.accentSoft },
  iconCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tileName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  tilePrice: { fontSize: 12, color: colors.textTertiary },
  status: { marginTop: 10, color: colors.accentDark, fontSize: 13 },
});
