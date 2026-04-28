import apiClient from './apiClient';
import { mapVehicle } from './vehicleService';

export const showroomService = {
  async getPublicProfile(userId) {
    const response = await apiClient.get('/api/showrooms/public/' + userId);
    return response.data?.data || null;
  },

  async getPublicVehicles(userId, { page = 1, limit = 12 } = {}) {
    const response = await apiClient.get('/api/showrooms/public/' + userId + '/vehicles', {
      params: { page, limit },
    });

    return {
      data: Array.isArray(response.data?.data) ? response.data.data.map(mapVehicle) : [],
      pagination: response.data?.pagination || {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
      showroom: response.data?.showroom || null,
    };
  },
};

export default showroomService;
