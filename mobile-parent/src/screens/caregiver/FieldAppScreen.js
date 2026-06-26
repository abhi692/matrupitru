import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Badge, Button, ErrorBox } from '../../components/ui';
import { colors } from '../../theme';

const STATUS_VARIANT = { scheduled: 'neutral', in_progress: 'warning', completed: 'success' };

export default function FieldAppScreen() {
  const { user, logout } = useAuth();
  const [visits, setVisits] = useState([]);
  const [medsByParent, setMedsByParent] = useState({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  function refresh() {
    api.get(`/visits?caregiverId=${user.id}`).then((vs) => {
      setVisits(vs);
      const parentIds = [...new Set(vs.filter((v) => v.status === 'in_progress').map((v) => v.parentId))];
      parentIds.forEach((pid) => {
        api.get(`/parents/${pid}/medications`).then((meds) => setMedsByParent((m) => ({ ...m, [pid]: meds.filter((med) => med.status === 'pending' || med.status === 'due') })));
      });
    }).catch((e) => setError(e.message));
  }

  useEffect(() => { refresh(); }, [user]);

  // Real GPS — no simulated coordinates, unlike the web caregiver app.
  async function getRealGeo() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission is required to check in.');
    const pos = await Location.getCurrentPositionAsync({});
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  }

  async function checkIn(visitId) {
    setError(''); setBusyId(visitId);
    try {
      const geo = await getRealGeo();
      await api.patch(`/visits/${visitId}/check-in`, geo);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function checkOut(visitId, checklist) {
    setError(''); setBusyId(visitId);
    try {
      const geo = await getRealGeo();
      await api.patch(`/visits/${visitId}/check-out`, { ...geo, checklist: checklist.map((c) => ({ ...c, done: true })) });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function uploadProof(visitId) {
    setError('');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') throw new Error('Camera permission is required.');
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6 });
      if (result.canceled) return;
      setBusyId(visitId);
      await api.upload(`/visits/${visitId}/proof/upload`, result.assets[0]);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function markMedication(logId, status) {
    try {
      await api.patch(`/medications/${logId}`, { status });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.headRow}>
        <Text style={s.title}>My visits</Text>
        <Text onPress={logout} style={s.logout}>Log out</Text>
      </View>
      <ErrorBox>{error}</ErrorBox>

      {visits.map((v) => {
        const checklist = JSON.parse(v.taskChecklistJson || '[]');
        const meds = medsByParent[v.parentId] || [];
        return (
          <Card key={v.id}>
            <View style={s.headRow}>
              <CardTitle>{v.type} — {v.parent.user.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[v.status]}>{v.status.replace('_', ' ')}</Badge>
            </View>
            <Text style={s.address}>{v.parent.address}</Text>

            {v.status === 'scheduled' && (
              <Button onPress={() => checkIn(v.id)} loading={busyId === v.id}>Check in (uses real GPS)</Button>
            )}

            {v.status === 'in_progress' && (
              <View>
                <Button variant="outline" onPress={() => uploadProof(v.id)} loading={busyId === v.id} style={{ marginBottom: 10 }}>
                  📷 Take proof photo
                </Button>
                {v.proofs?.length > 0 && <Text style={s.muted}>{v.proofs.length} photo(s) uploaded</Text>}

                {checklist.map((c, i) => <Text key={i} style={s.checklistItem}>• {c.task}</Text>)}

                {meds.length > 0 && (
                  <View style={s.medBox}>
                    <Text style={s.medBoxTitle}>Pending medications</Text>
                    {meds.map((med) => (
                      <View key={med.id} style={s.medRow}>
                        <Text style={s.rowText}>{med.medication}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <Button variant="subtle" onPress={() => markMedication(med.id, 'given')}>Given</Button>
                          <Button variant="outline" onPress={() => markMedication(med.id, 'missed')}>Missed</Button>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <Button onPress={() => checkOut(v.id, checklist)} loading={busyId === v.id} style={{ marginTop: 10 }}>
                  Complete checklist & check out
                </Button>
              </View>
            )}

            {v.status === 'completed' && (
              <Text style={{ color: v.geoVerified ? colors.brand700 : colors.warm600, fontWeight: '700' }}>
                {v.geoVerified ? '✅ Geo-verified' : '⚠️ Not geo-verified — flagged'}
              </Text>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 54, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.brand700 },
  logout: { color: colors.stone500, fontSize: 13 },
  address: { color: colors.stone400, fontSize: 13, marginBottom: 10 },
  muted: { color: colors.stone400, fontSize: 12, marginBottom: 8 },
  checklistItem: { fontSize: 14, color: colors.stone700, marginBottom: 4 },
  medBox: { borderWidth: 1, borderColor: colors.stone100, borderRadius: 12, padding: 10, marginVertical: 10 },
  medBoxTitle: { fontSize: 12, fontWeight: '700', color: colors.stone600, marginBottom: 6 },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowText: { fontSize: 14, color: colors.stone700 },
});
