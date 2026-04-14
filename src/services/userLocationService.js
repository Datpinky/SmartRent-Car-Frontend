import apiClient from './apiClient';

const mapUserLocation = (location = null) => {
  if (!location) {
    return null;
  }

  return {
    id: location._id || '',
    userId: location.user?._id || location.user || '',
    address: location.address || '',
    latitude: location.latitude ?? '',
    longitude: location.longitude ?? '',
    plusCode: location.plus_code || '',
    createdAt: location.createdAt || '',
    updatedAt: location.updatedAt || '',
    raw: location,
  };
};

export const userLocationService = {
  async getByUserId(userId) {
    if (!userId) {
      throw new Error('Missing user id for user location.');
    }

    const res = await apiClient.get(`/api/user_location/getUserLocationByUserId/${userId}`);
    return mapUserLocation(res.data.data);
  },

  async create(userId, payload) {
    if (!userId) {
      throw new Error('Missing user id for user location create.');
    }

    const res = await apiClient.post(`/api/user_location/createUserLocation/${userId}`, payload);
    return mapUserLocation(res.data.data);
  },

  async update(userId, payload) {
    if (!userId) {
      throw new Error('Missing user id for user location update.');
    }

    const res = await apiClient.put(`/api/user_location/updateUserLocationByUserId/${userId}`, payload);
    return mapUserLocation(res.data.data);
  },

  async remove(userId) {
    if (!userId) {
      throw new Error('Missing user id for user location delete.');
    }

    const res = await apiClient.delete(`/api/user_location/deleteUserLocationByUserId/${userId}`);
    return mapUserLocation(res.data.data);
  },
};

export default userLocationService;
