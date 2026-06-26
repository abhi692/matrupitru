import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from '../api/client';
import { getExpoPushToken } from '../lib/notifications';

const AuthContext = createContext(null);

// Best-effort: register the device's push token with the backend so SOS/alert/
// reminder events can reach this device instantly. Never blocks login on failure
// (no network, permission denied, Expo Go sandbox quirks) — push is a bonus
// channel, not a requirement to use the app.
async function registerPushToken() {
  try {
    const token = await getExpoPushToken();
    if (token) await api.patch('/me/push-token', { pushToken: token });
  } catch {
    // best-effort
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return setLoading(false);
      try {
        const me = await api.get('/me');
        setUser(me);
        registerPushToken();
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(phone, password) {
    const data = await api.post('/auth/login', { phone, password });
    await setToken(data.token);
    setUser(data.user);
    registerPushToken();
    return data.user;
  }

  async function logout() {
    await setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
