import apiClient from './apiClient';

const REVIEW_SUMMARY_TTL_MS = 5 * 60_000;
const reviewSummaryCache = new Map();

const getSummaryCacheKey = (vehicleId, limit) => `${vehicleId || ''}:${Number(limit || 100)}`;

const getCachedReviewSummary = (vehicleId, limit) => {
  const cacheKey = getSummaryCacheKey(vehicleId, limit);
  const cached = reviewSummaryCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() >= cached.expiresAt) {
    reviewSummaryCache.delete(cacheKey);
    return null;
  }
  return cached.data;
};

const setCachedReviewSummary = (vehicleId, limit, data) => {
  const cacheKey = getSummaryCacheKey(vehicleId, limit);
  reviewSummaryCache.set(cacheKey, {
    data,
    expiresAt: Date.now() + REVIEW_SUMMARY_TTL_MS,
  });
};

const normalizeReviewSummary = (response) => {
  const reviews = Array.isArray(response?.data) ? response.data : [];
  const reviewCount = Number(response?.pagination?.total ?? reviews.length ?? 0);
  const rating = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review?.rating || 0), 0) / reviews.length
    : 0;

  return {
    rating,
    reviewCount,
  };
};

export const reviewService = {
  invalidateSummaryCache(vehicleId) {
    if (!vehicleId) {
      reviewSummaryCache.clear();
      return;
    }

    const prefix = `${vehicleId}:`;
    [...reviewSummaryCache.keys()].forEach((key) => {
      if (key.startsWith(prefix)) {
        reviewSummaryCache.delete(key);
      }
    });
  },

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
   * Get current renter's reviews for a vehicle.
   * Returns: Review[]
   */
  async getMineByVehicleId(vehicleId) {
    const res = await apiClient.post('/api/reviews/my-by-vehicle', {
      vehicle_id: vehicleId,
    });
    return res.data.data || [];
  },

  /**
   * Create a review (requires auth + role user).
   * payload: { booking_id, vehicle_id, rating (1-5), comment? }
   */
  async create(payload) {
    const res = await apiClient.post('/api/reviews/create', payload);
    this.invalidateSummaryCache(payload?.vehicle_id);
    return res.data.data;
  },

  /**
   * Update own review (requires auth + role user).
   * payload: { review_id, rating (1-5), comment? }
   */
  async update(payload) {
    const res = await apiClient.patch('/api/reviews/update', payload);
    // Update payload may not carry vehicle_id, so clear all cached summaries to keep UI accurate.
    this.invalidateSummaryCache(payload?.vehicle_id);
    return res.data.data;
  },

  async getSummaryByVehicleId(vehicleId, { limit = 100 } = {}) {
    const cached = getCachedReviewSummary(vehicleId, limit);
    if (cached) {
      return cached;
    }

    const response = await this.getByVehicleId(vehicleId, { page: 1, limit });
    const summary = normalizeReviewSummary(response);
    setCachedReviewSummary(vehicleId, limit, summary);
    return summary;
  },

  async enrichVehiclesWithSummary(vehicles = [], { limit = 100 } = {}) {
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return [];
    }

    const settled = await Promise.allSettled(
      vehicles.map((vehicle) => this.getSummaryByVehicleId(vehicle.id || vehicle._id, { limit }))
    );

    return vehicles.map((vehicle, index) => {
      const summary = settled[index]?.status === 'fulfilled'
        ? settled[index].value
        : null;

      return {
        ...vehicle,
        rating: summary ? summary.rating : Number(vehicle.rating || 0),
        reviewCount: summary ? summary.reviewCount : Number(vehicle.reviewCount ?? vehicle.trips ?? 0),
      };
    });
  },
};

export default reviewService;
