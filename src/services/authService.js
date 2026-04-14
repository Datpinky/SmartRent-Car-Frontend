import apiClient from './apiClient';
import profileService from './profileService';

export const mapBackendRole = (backendRole) => {
  if (backendRole === 'user') return 'renter';
  return backendRole;
};

export const mapAuthUser = (user = {}) => ({
  id: user._id || user.id || '',
  _id: user._id || user.id || '',
  name: user.name || '',
  email: user.email || '',
  role: mapBackendRole(user.role || user.backendRole),
  backendRole: user.role || user.backendRole || '',
  phone: user.phone || '',
  address: user.address || '',
  age: user.age ?? '',
  showroom_status: user.showroom_status || '',
  business_name: user.business_name || '',
  createdAt: user.createdAt || '',
  updatedAt: user.updatedAt || '',
});

const readStoredUserId = () => {
  try {
    const raw = localStorage.getItem('smartrent_user');
    if (!raw) {
      return '';
    }

    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id || '';
  } catch {
    return '';
  }
};

const enrichWithProfile = async (user) => {
  const userId = user?._id || user?.id;
  if (!userId) {
    return mapAuthUser(user);
  }

  try {
    const profile = await profileService.getProfileById(userId);
    return {
      ...mapAuthUser(user),
      ...profile,
    };
  } catch {
    return mapAuthUser(user);
  }
};

export const authService = {
  async login(email, password) {
    const res = await apiClient.post('/api/auth/login', { email, password });
    const { user, token } = res.data.data;

    localStorage.setItem('smartrent_token', token);

    const frontendUser = await enrichWithProfile(user);
    return { user: frontendUser, token };
  },

  async registerConsumer({ name, email, password, phone, account_type = 'renter' }) {
    const body = {
      name,
      email,
      password,
      account_type,
    };

    if (phone && String(phone).trim()) {
      body.phone = String(phone).trim();
    }

    const res = await apiClient.post('/api/auth/register', body);
    return res.data.data;
  },

  async registerShowroom(payload) {
    const res = await apiClient.post('/api/auth/register-showroom', payload);
    return res.data.data;
  },

  async getCurrentUser() {
    const userId = readStoredUserId();
    if (!userId) {
      throw new Error('Khong tim thay user id de dong bo ho so.');
    }

    const profile = await profileService.getProfileById(userId);
    return mapAuthUser(profile);
  },

  logout() {
    localStorage.removeItem('smartrent_token');
    localStorage.removeItem('smartrent_user');
  },
};

export default authService;
