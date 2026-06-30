import React, { createContext, useState, useEffect, useContext } from 'react';
import { adminLogin as loginService, adminLogout as logoutService, adminRegister as registerService } from '../services/auth.service';
import { storeAuth, clearAuth, getStoredUser, getAccessToken } from '../utils/storage.utils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) setAdmin(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handle = () => setAdmin(null);
    window.addEventListener('admin:logout', handle);
    return () => window.removeEventListener('admin:logout', handle);
  }, []);

  const login = async (email, password) => {
    const data = await loginService(email, password);
    storeAuth(data);
    setAdmin(data.user);
    return data;
  };

  const register = async (first_name, last_name, email, password, registration_key) => {
    const data = await registerService(first_name, last_name, email, password, registration_key);
    storeAuth(data);
    setAdmin(data.user);
    return data;
  };

  const logout = async () => {
    try { await logoutService(); } catch (_) {}
    clearAuth();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
