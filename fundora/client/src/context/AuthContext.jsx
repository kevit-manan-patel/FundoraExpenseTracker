import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('fundora_token'));

  useEffect(() => {
    if (!localStorage.getItem('fundora_token')) return;
    api.get('/auth/me').then((r) => setUser(r.data.user)).catch(() => localStorage.removeItem('fundora_token')).finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback((data) => { localStorage.setItem('fundora_token', data.token); setUser(data.user); }, []);
  const login = async (email, password) => authenticate((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) => authenticate((await api.post('/auth/register', { name, email, password })).data);
  const logout = () => { localStorage.removeItem('fundora_token'); setUser(null); };

  return <AuthCtx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthCtx.Provider>;
}
