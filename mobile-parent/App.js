import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { ensureNotificationPermissions, setupAndroidChannel } from './src/lib/notifications';

// Two screens, no auth, no deep links between them — a local toggle is
// simpler and avoids nesting a second NavigationContainer just for this.
function AuthFlow() {
  const [mode, setMode] = useState('login');
  return mode === 'login'
    ? <LoginScreen onSwitchToRegister={() => setMode('register')} />
    : <RegisterScreen onSwitchToLogin={() => setMode('login')} />;
}

function Root() {
  const { user, loading } = useAuth();

  useEffect(() => {
    ensureNotificationPermissions();
    setupAndroidChannel();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1d9e75" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthFlow />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7f7f5' },
});
