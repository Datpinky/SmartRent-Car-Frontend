import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartrent_user');
      if (saved && saved !== 'undefined' && saved !== 'null' && saved.trim().startsWith('{')) {
        setUser(JSON.parse(saved));
      } else if (saved && (saved === 'undefined' || saved === 'null')) {
        localStorage.removeItem('smartrent_user');
      }
    } catch {
      localStorage.removeItem('smartrent_user');
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const { user: apiUser } = await authService.login(email, password);
      setUser(apiUser);
      localStorage.setItem('smartrent_user', JSON.stringify(apiUser));
      return { success: true, user: apiUser };
    } catch (err) {
      return { success: false, error: err.message || 'Email hoặc mật khẩu không đúng' };
    }
  };

  /**
   * Register consumer: account_type 'renter' | 'owner' → backend user | owner.
   */
  const register = async (name, email, password, phone, account_type = 'renter') => {
    try {
      await authService.registerConsumer({
        name,
        email,
        password,
        phone,
        account_type,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('smartrent_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
