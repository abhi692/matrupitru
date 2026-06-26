import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, Badge, Button, ErrorBox, EmptyState, ScreenTitle } from '../../components/ui';
import { colors } from '../../theme';

const STATUS_VARIANT = { scheduled: 'neutral', in_progress: 'warning' };

export default function TodayScreen() {
  const { user, logout } = useAuth();
  const [visits, setVisits] = useState([]);
  const [medsByParent, setMedsByParent] = useState({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  function refresh() {
    api.get(`/visits?caregiverId=${user.id}`).then((vs) => {
      const active = vs.filter((v) => v.status !== 'completed');
      setVisits(active);
      const parentIds = [...new Set(active.filter((v) => v.status === 'in_progress').map((v) => v.parentId))];
      parentIds.forEach((pid) => {
        api.get(`/parents/${pid}/medications`).then((meds) => setMedsByParent((m) => ({ ...m, [pid]: meds.filter((med) => med.status === 'pending' || med.status === 'due') })));
      });
    }).catch((e) => setError(e.message));
  }

  useEffect(() => { refresh(); }, [user]);

  async function onRefresh() {
    setRefreshing(true);
    refresh();
    setRefreshing(false);
  }

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
    <ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={s.headRow}>
        <ScreenTitle>Today</ScreenTitle>
        <Text onPress={logout} style={s.logout}>Log out</Text>
      </View>
      <ErrorBox>{error}</ErrorBox>

      {visits.length === 0 ? (
        <Card><EmptyState icon="calendar-outline" text="No active visits right now." /></Card>
      ) : visits.map((v) => {
        const checklist = JSON.parse(v.taskChecklistJson || '[]');
        const meds = medsByParent[v.parentId] || [];
        return (
          <Card key={v.id}>
            <View style={s.headRow}>
              <CardTitle>{v.type} — {v.parent.user.name}</CardTitle>
              <Badge variant={STATUS_VARIANT[v.status]}>{v.status.replace('_', ' ')}</Badge>
            </View>
            <View style={s.addressRow}>
              <Ionicons name="location-outline" size={13} color={colors.textTertiary} />
              <Text style={s.address}>{v.parent.address}</Text>
            </View>

            {v.status === 'scheduled' && (
              <Button onPress={() => checkIn(v.id)} loading={busyId === v.id} icon="navigate-outline">Check in (GPS)</Button>
            )}

            {v.status === 'in_progress' && (
              <View>
                <Button variant="outline" onPress={() => uploadProof(v.id)} loading={busyId === v.id} icon="camera-outline" style={{ marginBottom: 10 }}>
                  Take proof photo
                </Button>
                {v.proofs?.length > 0 && <Text style={s.muted}>{v.proofs.length} photo(s) uploaded</Text>}

                {checklist.map((c, i) => (
                  <View key={i} style={s.checkRow}>
                    <Ionicons name="ellipse-outline" size={14} color={colors.textTertiary} />
                    <Text style={s.checklistItem}>{c.task}</Text>
                  </View>
                ))}

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

                <Button onPress={() => checkOut(v.id, checklist)} loading={busyId === v.id} icon="checkmark-circle-outline" style={{ marginTop: 10 }}>
                  Complete & check out
                </Button>
              </View>
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  logout: { color: colors.textTertiary, fontSize: 13 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 12 },
  address: { color: colors.textTertiary, fontSize: 13 },
  muted: { color: colors.textTertiary, fontSize: 12, marginBottom: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 },
  checklistItem: { fontSize: 14, color: colors.textSecondary },
  medBox: { backgroundColor: colors.surfaceAlt, borderRadius: 14, padding: 12, marginVertical: 10 },
  medBoxTitle: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase' },
  medRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowText: { fontSize: 14, color: colors.textPrimary },
});
