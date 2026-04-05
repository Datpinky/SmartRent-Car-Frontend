import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartrent_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem('smartrent_user');
      localStorage.removeItem('smartrent_token');
    }
    setLoading(false);
  }, []);

  // ── Đăng nhập qua API thật ──────────────────────────────────
  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      // result.data = { user: { _id, first_name, last_name, email, roles, ... }, token }
      const { user: userData, token } = result.data;

      localStorage.setItem('smartrent_token', token);
      localStorage.setItem('smartrent_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      return { success: false, error: message };
    }
  };

  // ── Đăng ký qua API thật ───────────────────────────────────
  const register = async (userData) => {
    try {
      const result = await authService.register(userData);
      return { success: true, data: result.data };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Đăng ký thất bại';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartrent_user');
    localStorage.removeItem('smartrent_token');
  };

  // Cập nhật thông tin user cục bộ (sau khi edit profile)
  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('smartrent_user', JSON.stringify(updated));
  };

  // Helper: lấy full name từ first_name + other_name + last_name
  const getFullName = (u = user) => {
    if (!u) return '';
    return [u.first_name, u.other_name, u.last_name].filter(Boolean).join(' ');
  };

  // Helper: kiểm tra role
  const hasRole = (...roles) => roles.includes(user?.roles);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading,
      updateUser,
      register,
      getFullName,
      hasRole,
    }}>
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
