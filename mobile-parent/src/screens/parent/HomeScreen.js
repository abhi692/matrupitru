import { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, AppState, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { scheduleAllReminders } from '../../lib/notifications';
import { colors, radius, shadow } from '../../theme';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [parent, setParent] = useState(null);
  const [visits, setVisits] = useState([]);
  const [dueMeds, setDueMeds] = useState([]);
  const [sosStatus, setSosStatus] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

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
        const schedules = await api.get(`/parents/${p.id}/medication-schedules`);
        await scheduleAllReminders(schedules);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    if (!user?.familyId) return;
    function pollVideoCall() {
      api.get(`/families/${user.familyId}/video-sessions`).then((sessions) => {
        const live = sessions.find((s) => !s.expiresAt || new Date(s.expiresAt) > new Date());
        setActiveCall(live || null);
      }).catch(() => {});
    }
    pollVideoCall();
    const interval = setInterval(pollVideoCall, 8000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (dueMeds.length === 0) return;
    const med = dueMeds[0];
    const SPEECH_LOCALE = { hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN' };
    Speech.speak(`Time for your medicine: ${med.medication}`, { language: SPEECH_LOCALE[user?.locale] || 'en-US' });
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
      await api.post(`/parents/${parent.id}/sos`, {});
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

      {activeCall && (
        <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(activeCall.roomUrl)} activeOpacity={0.85}>
          <Ionicons name="videocam" size={22} color="#fff" />
          <Text style={styles.callButtonText}>Join video call</Text>
        </TouchableOpacity>
      )}

      {dueMeds.map((med) => (
        <View key={med.id} style={styles.alarmCard}>
          <View style={styles.alarmHead}>
            <Ionicons name="alarm" size={20} color={colors.warning} />
            <Text style={styles.alarmTitle}>Time for your medicine</Text>
          </View>
          <Text style={styles.alarmMed}>{med.medication}</Text>
          <TouchableOpacity style={styles.takeButton} onPress={() => takeMedication(med.id)} activeOpacity={0.8}>
            <Text style={styles.takeButtonText}>I took it</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.sosButton} onPress={raiseSos} activeOpacity={0.85}>
        <Ionicons name="warning" size={22} color="#fff" />
        <Text style={styles.sosButtonText}>I need help</Text>
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
              <TouchableOpacity style={styles.confirmButton} onPress={() => confirmVisit(v.id)} activeOpacity={0.8}>
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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  greeting: { fontSize: 26, fontWeight: '800', color: colors.textPrimary },
  logout: { color: colors.textTertiary, fontSize: 13 },
  errorBox: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: radius.control, marginBottom: 16 },
  alarmCard: { backgroundColor: colors.warningSoft, borderRadius: radius.card, padding: 22, marginBottom: 16, ...shadow },
  alarmHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alarmTitle: { fontSize: 15, fontWeight: '700', color: colors.warning },
  alarmMed: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  takeButton: { backgroundColor: colors.accent, borderRadius: radius.control, paddingVertical: 16, alignItems: 'center' },
  takeButtonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  callButton: { flexDirection: 'row', gap: 10, backgroundColor: colors.accent, borderRadius: radius.card, paddingVertical: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadow },
  callButtonText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  sosButton: { flexDirection: 'row', gap: 10, backgroundColor: colors.danger, borderRadius: radius.card, paddingVertical: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...shadow },
  sosButtonText: { color: '#fff', fontWeight: '700', fontSize: 19 },
  sosStatus: { backgroundColor: colors.successSoft, color: colors.accentDark, padding: 14, borderRadius: radius.control, marginBottom: 16, fontSize: 15 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 22, ...shadow },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  muted: { color: colors.textTertiary, fontSize: 15 },
  visitRow: { backgroundColor: colors.surfaceAlt, borderRadius: radius.control, padding: 16, marginBottom: 10 },
  visitText: { fontSize: 15, color: colors.textSecondary, marginBottom: 12, textTransform: 'capitalize' },
  confirmButton: { backgroundColor: colors.accent, borderRadius: radius.control, paddingVertical: 13, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
