import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PhoneInput from '../components/PhoneInput';
import { colors, radius, shadow } from '../theme';

// Anjali's a US-based NRI daughter (Seattle) coordinating care for her mother
// in Karnataka — her phone is intentionally a non-+91 number to reflect that.
// Demo accounts log straight in on tap instead of populating the phone field,
// so the India-only PhoneInput above never has to display a foreign number.
const DEMO_ACCOUNTS = [
  { label: 'Buyer', name: 'Anjali Rao', phone: '+12065550100' },
  { label: 'Parent', name: 'Lakshmi Rao', phone: '+919900000003' },
  { label: 'Care Manager', name: 'Ravi Kumar', phone: '+919900000001' },
  { label: 'Caregiver', name: 'Ramesh Naik', phone: '+919900000002' },
  { label: 'Admin', name: 'Priya Sharma', phone: '+919900000099' },
];

export default function LoginScreen({ onSwitchToRegister }) {
  const { login, requestOtp, verifyOtp } = useAuth();
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onPasswordSubmit() {
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRequestOtp() {
    setError('');
    setLoading(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp() {
    setError('');
    setLoading(true);
    try {
      await verifyOtp(phone, code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
    setOtpSent(false);
    setCode('');
  }

  async function quickLoginAsDemo(account) {
    setError('');
    setLoading(true);
    try {
      await login(account.phone, 'password123');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="heart" size={28} color={colors.white} />
      </View>
      <Text style={styles.logo}>MatruPitru</Text>
      <Text style={styles.subtitle}>Care your parents accept, visibility you can trust.</Text>

      <View style={styles.card}>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, mode === 'password' && styles.tabActive]} onPress={() => switchMode('password')}>
            <Text style={[styles.tabText, mode === 'password' && styles.tabTextActive]}>Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, mode === 'otp' && styles.tabActive]} onPress={() => switchMode('otp')}>
            <Text style={[styles.tabText, mode === 'otp' && styles.tabTextActive]}>OTP</Text>
          </TouchableOpacity>
        </View>

        {mode === 'password' && (
          <>
            <Text style={styles.label}>Phone</Text>
            <PhoneInput value={phone} onChange={setPhone} />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textTertiary} />
            {error ? <ErrorBox text={error} /> : null}
            <TouchableOpacity style={styles.button} onPress={onPasswordSubmit} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
            </TouchableOpacity>
          </>
        )}

        {mode === 'otp' && !otpSent && (
          <>
            <Text style={styles.label}>Phone</Text>
            <PhoneInput value={phone} onChange={setPhone} />
            {error ? <ErrorBox text={error} /> : null}
            <TouchableOpacity style={styles.button} onPress={onRequestOtp} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send code</Text>}
            </TouchableOpacity>
          </>
        )}

        {mode === 'otp' && otpSent && (
          <>
            <View style={styles.otpNotice}>
              <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.accentDark} />
              <Text style={styles.otpNoticeText}>A 6-digit code was sent to {phone}.</Text>
            </View>
            <Text style={styles.label}>Code</Text>
            <TextInput style={styles.input} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} placeholder="123456" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" />
            {error ? <ErrorBox text={error} /> : null}
            <TouchableOpacity style={styles.button} onPress={onVerifyOtp} disabled={loading} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify &amp; log in</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOtpSent(false)} style={{ marginTop: 12 }}>
              <Text style={styles.switchText}>Use a different phone or resend</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity onPress={onSwitchToRegister} style={{ marginTop: 20 }}>
        <Text style={styles.switchText}>New here? <Text style={styles.switchLink}>Create an account</Text></Text>
      </TouchableOpacity>

      <Text style={styles.demoHeading}>Demo accounts · tap to log in instantly</Text>
      <View style={styles.demoGrid}>
        {DEMO_ACCOUNTS.map((a) => (
          <TouchableOpacity key={a.phone} style={styles.demoCard} onPress={() => quickLoginAsDemo(a)} activeOpacity={0.7}>
            <Text style={styles.demoLabel}>{a.label}</Text>
            <Text style={styles.demoName}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function ErrorBox({ text }) {
  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Text style={styles.error}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, paddingTop: 80 },
  logoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logo: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 28, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 20, ...shadow },
  tabRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.control, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.control, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface, ...shadow },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textTertiary },
  tabTextActive: { color: colors.accentDark },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
  button: { backgroundColor: colors.accent, borderRadius: radius.control, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: radius.control, marginTop: 14 },
  error: { color: colors.danger, fontSize: 13, flex: 1 },
  otpNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.accentSoft, padding: 12, borderRadius: radius.control, marginBottom: 4 },
  otpNoticeText: { color: colors.accentDark, fontSize: 13, flex: 1 },
  switchText: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
  switchLink: { color: colors.accent, fontWeight: '700' },
  demoHeading: { textAlign: 'center', color: colors.textTertiary, fontSize: 12, fontWeight: '600', marginTop: 28, marginBottom: 10 },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  demoCard: { width: '46%', backgroundColor: colors.surface, borderRadius: radius.control, padding: 13, ...shadow },
  demoLabel: { fontSize: 13, fontWeight: '700', color: colors.accentDark },
  demoName: { fontSize: 12, color: colors.textSecondary },
});
