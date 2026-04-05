import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - đính token vào mỗi request nếu có
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartrent_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xử lý lỗi 401 (hết hạn token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smartrent_token');
      localStorage.removeItem('smartrent_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
