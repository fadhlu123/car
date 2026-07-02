import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, logout as logoutService, googleAuth } from '../services/auth.service';
import {
  storeAuth, clearAuth, getStoredUser, getAccessToken,
} from '../utils/storage.utils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) setUser(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = () => { setUser(null); };
    window.addEventListener('auth:logout', handle);
    return () => window.removeEventListener('auth:logout', handle);
  }, []);

  const login = async (email, password) => {
    const data = await loginService(email, password);
    storeAuth(data);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    const data = await googleAuth(idToken);
    storeAuth(data);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try { await logoutService(); } catch (_) {}
    clearAuth();
    setUser(null);
  };

  const updateUser = (updated) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
