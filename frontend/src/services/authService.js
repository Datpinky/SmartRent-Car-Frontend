import apiClient from './apiClient';

/**
 * Maps backend role to frontend role used in routing/UI.
 * Backend:  user | owner | showroom | admin
 * Frontend: renter (=user) | owner | showroom | admin
 */
export const mapBackendRole = (backendRole) => {
  if (backendRole === 'user') return 'renter';
  return backendRole;
};

export const authService = {
  async login(email, password) {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const payload = res.data?.data;
    if (!payload?.user || !payload?.token) {
      throw new Error('Phản hồi đăng nhập không hợp lệ.');
    }
    const { user, token } = payload;

    const frontendUser = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: mapBackendRole(user.role),
      backendRole: user.role,
      phone: user.phone,
      showroom_status: user.showroom_status,
      business_name: user.business_name,
    };

    localStorage.setItem('smartrent_token', token);
    return { user: frontendUser, token };
  },

  /**
   * Đăng ký consumer: renter (account_type renter) hoặc owner (account_type owner).
   */
  async registerConsumer({ name, email, password, phone, account_type = 'renter' }) {
    const body = {
      name,
      email,
      password,
      account_type,
    };
    if (phone && String(phone).length === 10) body.phone = phone;
    const res = await apiClient.post('/api/auth/register', body);
    return res.data.data;
  },

  /**
   * Đăng ký đối tác showroom (form riêng).
   */
  async registerShowroom(payload) {
    const res = await apiClient.post('/api/auth/register-showroom', payload);
    return res.data.data;
  },

  logout() {
    localStorage.removeItem('smartrent_token');
    localStorage.removeItem('smartrent_user');
  },
};

export default authService;
