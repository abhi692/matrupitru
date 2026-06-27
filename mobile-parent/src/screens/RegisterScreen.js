import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import PhoneInput, { isValidPhoneNumber } from '../components/PhoneInput';
import { colors, radius, shadow } from '../theme';

// Public self-signup — always creates a buyer account (the backend enforces
// this; see backend/src/modules/identity/routes.js). Other roles (parent,
// caregiver, care manager, admin) are still provisioned internally.
export default function RegisterScreen({ onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    if (!isValidPhoneNumber(phone)) {
      setError('Enter a valid phone number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({ name, phone, password });
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
      <Text style={styles.logo}>Create your account</Text>
      <Text style={styles.subtitle}>Set up MatruPitru to coordinate care for your parent.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Anjali Rao" placeholderTextColor={colors.textTertiary} />
        <Text style={styles.label}>Phone</Text>
        <PhoneInput value={phone} onChange={setPhone} />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.textTertiary} secureTextEntry />
        <Text style={styles.label}>Confirm password</Text>
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor={colors.textTertiary} />

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onSwitchToLogin} style={{ marginTop: 20 }}>
        <Text style={styles.switchText}>Already have an account? <Text style={styles.switchLink}>Log in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.bg, justifyContent: 'center', padding: 24, paddingTop: 80 },
  logoCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logo: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 28, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 20, ...shadow },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: colors.textPrimary },
  button: { backgroundColor: colors.accent, borderRadius: radius.control, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: radius.control, marginTop: 14 },
  error: { color: colors.danger, fontSize: 13, flex: 1 },
  switchText: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
  switchLink: { color: colors.accent, fontWeight: '700' },
});
