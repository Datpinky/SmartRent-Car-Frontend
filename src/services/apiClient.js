import axios from 'axios';

const AUTH_CLEARED_EVENT = 'smartrent:auth-cleared';

const resolveBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3000') {
    return '';
  }

  return 'http://localhost:5000';
};

const clearStoredAuth = () => {
  localStorage.removeItem('smartrent_token');
  localStorage.removeItem('smartrent_user');

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
  }
};

const apiClient = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartrent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const validationErrors = error.response?.data?.errors;

    let normalizedMessage = 'Da xay ra loi. Vui long thu lai.';

    if (!error.response) {
      normalizedMessage = 'Khong the ket noi den may chu. Kiem tra backend dang chay tai cong 5000.';
    } else if (status === 401) {
      normalizedMessage = serverMessage || 'Phien dang nhap het han. Vui long dang nhap lai.';
      clearStoredAuth();
    } else if (status === 403) {
      normalizedMessage = serverMessage || 'Ban khong co quyen thuc hien thao tac nay.';
    } else if (status === 404) {
      normalizedMessage = serverMessage || 'Khong tim thay du lieu yeu cau.';
    } else if (status === 422 && validationErrors) {
      normalizedMessage = validationErrors.map((item) => item.msg || item.message).join(', ');
    } else if (serverMessage) {
      normalizedMessage = serverMessage;
    }

    const normalizedError = new Error(normalizedMessage);
    normalizedError.status = status;
    normalizedError.raw = error.response?.data;
    return Promise.reject(normalizedError);
  }
);

export default apiClient;
