import apiClient from './apiClient';

export const reviewService = {
  /**
   * Get paginated reviews for a vehicle.
   * vehicleId: MongoDB ObjectId string
   * Returns: { data: Review[], pagination }
   */
  async getByVehicleId(vehicleId, { page = 1, limit = 10 } = {}) {
    const res = await apiClient.post('/api/reviews/get-by-vehicle', {
      vehicle_id: vehicleId,
      page,
      limit,
    });
    return res.data;
  },

  /**
   * Create a review (requires auth + role user).
   * payload: { vehicle_id, rating (1-5), comment? }
   */
  async create(payload) {
    const res = await apiClient.post('/api/reviews/create', payload);
    return res.data.data;
  },

  /**
   * Update own review (requires auth + role user).
   * payload: { review_id, rating (1-5), comment? }
   */
  async update(payload) {
    const res = await apiClient.patch('/api/reviews/update', payload);
    return res.data.data;
  },
};

export default reviewService;
