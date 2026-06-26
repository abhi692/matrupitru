import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

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
      <Text style={styles.logo}>MatruPitru</Text>
      <Text style={styles.subtitle}>Care your parents accept, visibility you can trust.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+91..." keyboardType="phone-pad" />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log in</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.demoHeading}>DEMO ACCOUNTS · PASSWORD123</Text>
      <View style={styles.demoGrid}>
        {DEMO_ACCOUNTS.map((a) => (
          <TouchableOpacity key={a.phone} style={styles.demoCard} onPress={() => setPhone(a.phone)}>
            <Text style={styles.demoLabel}>{a.label}</Text>
            <Text style={styles.demoName}>{a.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.cream100, justifyContent: 'center', padding: 24, paddingTop: 80 },
  logo: { fontSize: 28, fontWeight: '800', color: colors.brand700, textAlign: 'center' },
  subtitle: { color: colors.stone500, textAlign: 'center', marginTop: 6, marginBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: colors.brand600, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
  label: { fontSize: 13, fontWeight: '600', color: colors.stone600, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.stone200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  button: { backgroundColor: colors.brand500, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: colors.rose600, marginTop: 10 },
  demoHeading: { textAlign: 'center', color: colors.stone400, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 28, marginBottom: 10 },
  demoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  demoCard: { width: '46%', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.stone200, borderRadius: 12, padding: 12 },
  demoLabel: { fontSize: 13, fontWeight: '700', color: colors.brand700 },
  demoName: { fontSize: 12, color: colors.stone500 },
});
