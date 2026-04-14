import apiClient from './apiClient';

/**
 * Backend trả { data: [...], pagination } hoặc (legacy) mảng trực tiếp.
 * @returns {{ items: array, pagination: object|null }}
 */
function normalizeListPayload(raw) {
  if (Array.isArray(raw)) return { items: raw, pagination: null };
  if (raw && Array.isArray(raw.data)) {
    return { items: raw.data, pagination: raw.pagination ?? null };
  }
  return { items: [], pagination: null };
}

const bookingService = {
  async createBooking(data) {
    const res = await apiClient.post('/api/booking/createBooking', data);
    return res.data?.data ?? res.data;
  },

  /**
   * @param {object} filters — showroom_id, user_id, status, page, limit, …
   * @returns {Promise<{ items: array, pagination: object|null }>}
   */
  async getListBookings(filters = {}) {
    const res = await apiClient.post('/api/booking/getListBookings', {
      limit: 100,
      page: 1,
      ...filters,
    });
    return normalizeListPayload(res.data?.data ?? res.data);
  },

  async getBookingById(bookingId) {
    const res = await apiClient.get(`/api/booking/getBookingById/${bookingId}`);
    return res.data?.data ?? res.data;
  },

  async updateBookingStatus(bookingId, status) {
    const res = await apiClient.patch(`/api/booking/updateBookingStatus/${bookingId}`, { status });
    return res.data?.data ?? res.data;
  },
};

export default bookingService;
