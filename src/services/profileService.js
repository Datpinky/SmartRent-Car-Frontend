import apiClient from './apiClient';

const mapBackendRole = (backendRole) => {
  if (backendRole === 'user') return 'renter';
  return backendRole;
};

const mapProfileUser = (user = {}) => ({
  id: user._id,
  _id: user._id,
  name: user.name || '',
  email: user.email || '',
  role: mapBackendRole(user.role),
  backendRole: user.role,
  phone: user.phone || '',
  address: user.address || '',
  age: user.age ?? '',
  showroom_status: user.showroom_status || '',
  business_name: user.business_name || '',
  createdAt: user.createdAt || '',
  updatedAt: user.updatedAt || '',
});

export const profileService = {
  async getProfileById(userId) {
    if (!userId) {
      throw new Error('Missing user id for profile request.');
    }

    const res = await apiClient.get(`/api/profile/getProfileById/${userId}`);
    return mapProfileUser(res.data.data);
  },

  async updateProfile(userId, payload = {}) {
    if (!userId) {
      throw new Error('Missing user id for profile update.');
    }

    const res = await apiClient.put(`/api/profile/updateProfile/${userId}`, payload);
    return mapProfileUser(res.data.data);
  },

  mapProfileUser,
};

export default profileService;
