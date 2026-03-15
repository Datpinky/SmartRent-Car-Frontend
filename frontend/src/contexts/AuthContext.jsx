import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

const MOCK_USERS = [
  { id: 1, email: 'admin@smartrent.com', password: '123456', role: 'admin', name: 'Admin SmartRent', phone: '0900000001' },
  { id: 2, email: 'showroom@smartrent.com', password: '123456', role: 'showroom', name: 'Showroom Minh Hoàng', phone: '0900000002', showroomId: 1 },
  { id: 3, email: 'owner@smartrent.com', password: '123456', role: 'owner', name: 'Nguyễn Văn Khoa', phone: '0900000003' },
  { id: 4, email: 'user@smartrent.com', password: '123456', role: 'renter', name: 'Trần Thị Mai', phone: '0900000004' },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smartrent_user');
      if (saved) setUser(JSON.parse(saved));
    } catch {
      localStorage.removeItem('smartrent_user');
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      localStorage.setItem('smartrent_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Email hoặc mật khẩu không đúng' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('smartrent_user');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('smartrent_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
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
