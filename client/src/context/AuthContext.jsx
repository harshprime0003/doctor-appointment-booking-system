import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AuthApi } from '../api/endpoints.js';
import { setAuthToken, loadAuthToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user: u, doctorProfile: dp } = await AuthApi.me();
      setUser(u);
      setDoctorProfile(dp || null);
    } catch {
      setAuthToken(null);
      setUser(null);
      setDoctorProfile(null);
    }
  }, []);

  useEffect(() => {
    const token = loadAuthToken();
    if (!token) {
      setInitializing(false);
      return;
    }
    refresh().finally(() => setInitializing(false));
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const { token, user: u } = await AuthApi.login(credentials);
    setAuthToken(token);
    setUser(u);
    if (u.role === 'doctor') {
      const me = await AuthApi.me();
      setDoctorProfile(me.doctorProfile || null);
    }
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const { token, user: u } = await AuthApi.register(data);
    setAuthToken(token);
    setUser(u);
    if (u.role === 'doctor') {
      const me = await AuthApi.me();
      setDoctorProfile(me.doctorProfile || null);
    }
    return u;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setDoctorProfile(null);
  }, []);

  const value = {
    user,
    doctorProfile,
    initializing,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refresh,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
