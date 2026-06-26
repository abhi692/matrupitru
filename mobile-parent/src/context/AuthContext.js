import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

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
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function login(phone, password) {
    const data = await api.post('/auth/login', { phone, password });
    if (data.user.role !== 'parent') {
      throw new Error('This app is for parent accounts only.');
    }
    await setToken(data.token);
    setUser(data.user);
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
