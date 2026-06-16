import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService } from '../services/auth.service';
import { getStoredUserInfo, setStoredUserInfo, clearStoredUserInfo } from '../utils/storage.utils';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = getStoredUserInfo();
    if (userInfo) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginService(email, password);
    setUser(data);
    setStoredUserInfo(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    clearStoredUserInfo();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
