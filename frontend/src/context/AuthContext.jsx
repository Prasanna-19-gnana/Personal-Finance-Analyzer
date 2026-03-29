import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Rehydrate from localStorage on mount ──────────────────
  useEffect(() => {
    const token      = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try { setUser(JSON.parse(storedUser)); }
      catch { logout(); }  // corrupt storage → force re-login
    }
    setLoading(false);
  }, []);

  // ── Login: email and password ─────────────────────────────
  const loginForm = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user',  JSON.stringify(userData));
    setUser(userData);
  }, []);

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login: loginForm, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
