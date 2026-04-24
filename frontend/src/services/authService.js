import apiClient from './apiClient';

const AUTH_CLEARED_EVENT = 'smartrent:auth-cleared';

/**
 * Maps backend role to frontend role used in routing/UI.
 * Backend:  user | owner | showroom | admin
 * Frontend: renter (=user) | owner | showroom | admin
 */
export const mapBackendRole = (backendRole) => {
  if (backendRole === 'user') return 'renter';
  return backendRole;
};

const mapFrontendConsumerRoleToBackend = (frontendRole) => {
  if (frontendRole === 'owner') return 'owner';
  return 'user';
};

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('smartrent_user') || 'null');
  } catch {
    return null;
  }
};

export const authService = {
  async login(email, password) {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const payload = res.data?.data;

    if (!payload?.user || !payload?.token) {
      throw new Error('Phan hoi dang nhap khong hop le.');
    }

    const { user, token } = payload;
    const frontendUser = {
      id: user._id,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: mapBackendRole(user.role),
      backendRole: user.role,
      phone: user.phone || '',
      showroom_status: user.showroom_status,
      business_name: user.business_name,
      address: user.userLocation?.address || '',
    };

    localStorage.setItem('smartrent_token', token);
    return { user: frontendUser, token };
  },

  async registerConsumer({ name, email, password, phone, account_type = 'renter' }) {
    const body = {
      name,
      email,
      password,
      account_type,
      role: mapFrontendConsumerRoleToBackend(account_type),
    };

    if (phone && String(phone).length === 10) {
      body.phone = phone;
    }

    const res = await apiClient.post('/api/auth/register', body);
    return res.data?.data;
  },

  async registerShowroom(payload) {
    const res = await apiClient.post('/api/auth/register-showroom', payload);
    return res.data?.data;
  },

  logout() {
    localStorage.removeItem('smartrent_token');
    localStorage.removeItem('smartrent_user');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(AUTH_CLEARED_EVENT));
    }
  },

  mapUser(user) {
    if (!user) return null;

    return {
      id: user._id || user.id,
      _id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: mapBackendRole(user.role || user.backendRole),
      backendRole: user.backendRole || user.role,
      phone: user.phone || '',
      showroom_status: user.showroom_status,
      business_name: user.business_name,
      address: user.userLocation?.address || '',
    };
  },

  async getCurrentUser() {
    const storedUser = readStoredUser();
    if (!storedUser) {
      throw new Error('Khong tim thay thong tin nguoi dung da dang nhap.');
    }
    return this.mapUser(storedUser);
  },

  async updateProfile({ name, phone }) {
    const res = await apiClient.patch('/api/auth/me', { name, phone });
    return this.mapUser(res.data?.data);
  },

  async changePassword({ currentPassword, newPassword }) {
    const res = await apiClient.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });

    const token = res.data?.data?.token;
    if (token) {
      localStorage.setItem('smartrent_token', token);
    }

    return res.data?.data;
  },

  async listSessions() {
    const res = await apiClient.get('/api/auth/sessions');
    return res.data?.data;
  },
};

export default authService;
