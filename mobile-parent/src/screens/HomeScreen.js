import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, AppState } from 'react-native';
import * as Speech from 'expo-speech';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { scheduleAllReminders } from '../lib/notifications';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [parent, setParent] = useState(null);
  const [visits, setVisits] = useState([]);
  const [dueMeds, setDueMeds] = useState([]);
  const [sosStatus, setSosStatus] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!user?.familyId) return;
    try {
      const d = await api.get(`/families/${user.familyId}/dashboard`);
      const p = d.parents.find((p) => p.userId === user.id) || d.parents[0];
      setParent(p);
      setVisits([...d.upcomingVisits, ...d.recentVisits.filter((v) => !v.parentConfirmedAt)]);

      if (p) {
        const meds = await api.get(`/parents/${p.id}/medications`);
        setDueMeds(meds.filter((m) => m.status === 'due'));

        // Re-sync OS-scheduled alarms with whatever the Care Manager has set up —
        // covers new/paused reminders without needing a background sync.
        const schedules = await api.get(`/parents/${p.id}/medication-schedules`);
        await scheduleAllReminders(schedules);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    // Re-sync whenever the app comes back to the foreground (e.g. user opened
    // it after a notification fired) — this is also when OS alarms get refreshed.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (dueMeds.length === 0) return;
    const med = dueMeds[0];
    Speech.speak(`Time for your medicine: ${med.medication}`, { language: user?.locale === 'kn' ? 'kn-IN' : user?.locale === 'hi' ? 'hi-IN' : 'en-US' });
  }, [dueMeds]);

  async function onRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function takeMedication(logId) {
    setError('');
    try {
      await api.patch(`/medications/${logId}`, { status: 'given' });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmVisit(visitId) {
    setError('');
    try {
      await api.post(`/visits/${visitId}/confirm`);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function raiseSos() {
    if (!parent) return;
    setSosStatus('');
    try {
      const result = await api.post(`/parents/${parent.id}/sos`, {});
      setSosStatus('Help is on the way. Your family and Care Manager have been notified.');
      Speech.speak('Help is on the way.', { language: 'en-US' });
    } catch (err) {
      setError(err.message);
    }
  }

  const pendingConfirm = visits.filter((v) => v.status === 'completed' && !v.parentConfirmedAt);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Namaste, {parent?.user?.name || ''}</Text>
        <TouchableOpacity onPress={logout}><Text style={styles.logout}>Log out</Text></TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}

      {dueMeds.map((med) => (
        <View key={med.id} style={styles.alarmCard}>
          <Text style={styles.alarmTitle}>🔔 Time for your medicine</Text>
          <Text style={styles.alarmMed}>{med.medication}</Text>
          <TouchableOpacity style={styles.takeButton} onPress={() => takeMedication(med.id)}>
            <Text style={styles.takeButtonText}>I took it</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.sosButton} onPress={raiseSos}>
        <Text style={styles.sosButtonText}>🚨  I need help</Text>
      </TouchableOpacity>
      {sosStatus ? <Text style={styles.sosStatus}>{sosStatus}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Did your caregiver visit today?</Text>
        {pendingConfirm.length === 0 ? (
          <Text style={styles.muted}>No visit waiting for your confirmation.</Text>
        ) : (
          pendingConfirm.map((v) => (
            <View key={v.id} style={styles.visitRow}>
              <Text style={styles.visitText}>{v.type} visit — {new Date(v.checkOutAt).toLocaleString()}</Text>
              <TouchableOpacity style={styles.confirmButton} onPress={() => confirmVisit(v.id)}>
                <Text style={styles.confirmButtonText}>Yes, they visited</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f5' },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#0c5945' },
  logout: { color: '#78716c', fontSize: 13 },
  errorBox: { backgroundColor: '#fde8ea', color: '#b00020', padding: 12, borderRadius: 10, marginBottom: 16 },
  alarmCard: { backgroundColor: '#fff8e6', borderWidth: 2, borderColor: '#ffe6a3', borderRadius: 20, padding: 20, marginBottom: 16 },
  alarmTitle: { fontSize: 16, fontWeight: '700', color: '#b06000', marginBottom: 6 },
  alarmMed: { fontSize: 20, fontWeight: '700', color: '#292524', marginBottom: 14 },
  takeButton: { backgroundColor: '#1d9e75', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  takeButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  sosButton: { backgroundColor: '#b00020', borderRadius: 20, paddingVertical: 22, alignItems: 'center', marginBottom: 14 },
  sosButtonText: { color: '#fff', fontWeight: '800', fontSize: 19 },
  sosStatus: { backgroundColor: '#e1f5ee', color: '#0c5945', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#0f6e56', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#292524', marginBottom: 12 },
  muted: { color: '#a8a29e', fontSize: 15 },
  visitRow: { borderWidth: 1, borderColor: '#f0efe9', borderRadius: 12, padding: 14, marginBottom: 10 },
  visitText: { fontSize: 15, color: '#44403c', marginBottom: 10, textTransform: 'capitalize' },
  confirmButton: { backgroundColor: '#1d9e75', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
