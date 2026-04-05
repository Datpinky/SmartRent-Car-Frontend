import api from './api';

// POST /api/auth/register
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data; // { message, data: newUser }
};

// POST /api/auth/login
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data; // { message, data: { user, token } }
};
