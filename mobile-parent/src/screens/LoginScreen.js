import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors, radius, shadow } from '../theme';

const DEMO_ACCOUNTS = [
  { label: 'Buyer', name: 'Anjali Rao', phone: '+12065550100' },
  { label: 'Parent', name: 'Lakshmi Rao', phone: '+919900000003' },
  { label: 'Care Manager', name: 'Ravi Kumar', phone: '+919900000001' },
  { label: 'Caregiver', name: 'Ramesh Naik', phone: '+919900000002' },
  { label: 'Admin', name: 'Priya Sharma', phone: '+919900000099' },
];

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="heart" size={28} color={colors.white} />
      </View>
      <Text style={styles.logo}>MatruPitru</Text>
      <Text style={styles.subtitle}>Care your parents accept, visibility you can trust.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91..." placeholderTextColor={colors.textTertiary} keyboardType="phone-pad" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textTertiary} />

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.demoHeading}>Demo accounts · password123</Text>
      <View style={styles.demoGrid}>
        {DEMO_ACCOUNTS.map((a) => (
          <TouchableOpacity key={a.phone} style={styles.demoCard} onPress={() => setPhone(a.phone)} activeOpacity={0.7}>
            <Text style={styles.demoLabel}>{a.label}</Text>
            <Text style={styles.demoName}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, paddingTop: 80 },
  logoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logo: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 28, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 20, ...shadow },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
  button: { backgroundColor: colors.accent, borderRadius: radius.control, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: radius.control, marginTop: 14 },
  error: { color: colors.danger, fontSize: 13, flex: 1 },
  demoHeading: { textAlign: 'center', color: colors.textTertiary, fontSize: 12, fontWeight: '600', marginTop: 28, marginBottom: 10 },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  demoCard: { width: '46%', backgroundColor: colors.surface, borderRadius: radius.control, padding: 13, ...shadow },
  demoLabel: { fontSize: 13, fontWeight: '700', color: colors.accentDark },
  demoName: { fontSize: 12, color: colors.textSecondary },
});
