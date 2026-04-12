import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);
const AUTH_CLEARED_EVENT = 'smartrent:auth-cleared';

const readStoredUser = () => {
  const token = localStorage.getItem('smartrent_token');
  const savedUser = localStorage.getItem('smartrent_user');

  if (!token || !savedUser) {
    localStorage.removeItem('smartrent_token');
    localStorage.removeItem('smartrent_user');
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('smartrent_token');
    localStorage.removeItem('smartrent_user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistUser = useCallback((nextUser) => {
    localStorage.setItem('smartrent_user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('smartrent_token');
    if (!token) {
      setUser(null);
      return null;
    }

    const apiUser = await authService.getCurrentUser();
    persistUser(apiUser);
    return apiUser;
  }, [persistUser]);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const storedUser = readStoredUser();
      setUser(storedUser);

      if (!localStorage.getItem('smartrent_token')) {
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();

    const handleAuthCleared = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);
    return () => window.removeEventListener(AUTH_CLEARED_EVENT, handleAuthCleared);
  }, [refreshUser]);

  const login = async (email, password) => {
    try {
      const { user: apiUser } = await authService.login(email, password);
      persistUser(apiUser);
      return { success: true, user: apiUser };
    } catch (err) {
      const message = err.status === 401
        ? 'Email hoac mat khau khong dung.'
        : (err.message || 'Dang nhap that bai.');
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password, phone, accountType = 'renter') => {
    try {
      await authService.registerConsumer({
        name,
        email,
        password,
        phone,
        account_type: accountType,
      });
      return { success: true };
    } catch (err) {
      const message = err.status === 409
        ? 'Email nay da ton tai. Hay dang nhap bang tai khoan hien co.'
        : err.message;
      return { success: false, error: message };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      const updated = { ...currentUser, ...updates };
      localStorage.setItem('smartrent_user', JSON.stringify(updated));
      return updated;
    });
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user && localStorage.getItem('smartrent_token')),
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
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
