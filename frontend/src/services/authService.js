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
      tax_code: user.tax_code,
      public_address: user.public_address,
      opening_hours: user.opening_hours,
      policy_text: user.policy_text,
      logo_url: user.logo_url,
      showroom_description: user.showroom_description,
      showroom_representative_name: user.showroom_representative_name,
      showroom_license_public: user.showroom_license_public,
      license_document_urls: user.license_document_urls,
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

  mapUser(u) {
    if (!u) return null;
    return {
      id: u._id,
      _id: u._id,
      name: u.name,
      email: u.email,
      role: mapBackendRole(u.role),
      backendRole: u.role,
      phone: u.phone || '',
      showroom_status: u.showroom_status,
      business_name: u.business_name || '',
      tax_code: u.tax_code || '',
      public_address: u.public_address || '',
      opening_hours: u.opening_hours || '',
      policy_text: u.policy_text || '',
      logo_url: u.logo_url || '',
      showroom_description: u.showroom_description || '',
      showroom_representative_name: u.showroom_representative_name || '',
      showroom_license_public: u.showroom_license_public || '',
      license_document_urls: u.license_document_urls || [],
    };
  },

  async getMe() {
    const res = await apiClient.get('/api/auth/me');
    const u = res.data?.data;
    return this.mapUser(u);
  },

  async updateProfile(payload) {
    const res = await apiClient.patch('/api/auth/me', payload);
    const u = res.data?.data;
    return this.mapUser(u);
  },

  async changePassword({ currentPassword, newPassword }) {
    const res = await apiClient.post('/api/auth/change-password', { currentPassword, newPassword });
    const token = res.data?.data?.token;
    if (token) {
      localStorage.setItem('smartrent_token', token);
    }
    return res.data?.data;
  },

  /** Danh sách phiên đăng nhập đã lưu (theo JWT phiên bản mới). */
  async listSessions() {
    const res = await apiClient.get('/api/auth/sessions');
    return res.data?.data;
  },
};

export default authService;
