import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+919900000003');
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f7f5', justifyContent: 'center', padding: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: '#0c5945', textAlign: 'center' },
  subtitle: { color: '#78716c', textAlign: 'center', marginTop: 6, marginBottom: 28 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#0f6e56', shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 },
  label: { fontSize: 13, fontWeight: '600', color: '#57534e', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  button: { backgroundColor: '#1d9e75', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#b00020', marginTop: 10 },
});
