import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem('smartrent_token');
      if (!token) {
        try {
          const saved = localStorage.getItem('smartrent_user');
          if (saved) localStorage.removeItem('smartrent_user');
        } catch {
          /* ignore */
        }
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const u = await authService.getMe();
        if (!cancelled && u) {
          setUser(u);
          localStorage.setItem('smartrent_user', JSON.stringify(u));
        }
      } catch (e) {
        if (cancelled) return;
        if (e?.status === 401) {
          authService.logout();
          setUser(null);
        } else {
          try {
            const saved = localStorage.getItem('smartrent_user');
            if (saved && saved !== 'undefined' && saved !== 'null' && saved.trim().startsWith('{')) {
              setUser(JSON.parse(saved));
            }
          } catch {
            authService.logout();
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  /** Cố định tham chiếu để tránh useEffect (vd. Profile) phụ thuộc chạy lại vô hạn. */
  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('smartrent_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

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
