import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartrent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;
    const validationErrors = error.response?.data?.errors;

    let normalizedMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';

    if (!error.response) {
      normalizedMessage = 'Không thể kết nối đến máy chủ. Kiểm tra backend đang chạy tại cổng 5000.';
    } else if (status === 401) {
      normalizedMessage = serverMessage || 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
      localStorage.removeItem('smartrent_token');
      localStorage.removeItem('smartrent_user');
    } else if (status === 403) {
      normalizedMessage = serverMessage || 'Bạn không có quyền thực hiện thao tác này.';
    } else if (status === 404) {
      normalizedMessage = serverMessage || 'Không tìm thấy dữ liệu yêu cầu.';
    } else if (status === 422 && validationErrors) {
      normalizedMessage = validationErrors.map((e) => e.msg || e.message).join(', ');
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
